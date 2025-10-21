import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();

const app = express();
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.use(express.json());
app.use(express.static("public"));

// Home route with better UI
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🧟 Zombie Face Transformer</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          text-align: center;
          background: #1a1a1a;
          color: #fff;
        }
        h2 { color: #7CFC00; }
        form {
          background: #2a2a2a;
          padding: 30px;
          border-radius: 10px;
          margin-top: 20px;
        }
        input[type="file"] {
          margin: 20px 0;
          padding: 10px;
        }
        button {
          background: #7CFC00;
          color: #000;
          border: none;
          padding: 15px 30px;
          font-size: 16px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }
        button:hover { background: #6FE000; }
        .preview {
          margin-top: 20px;
          max-width: 100%;
        }
        #imagePreview {
          max-width: 300px;
          margin-top: 10px;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <h2>🧟 Transform Your Face into a Zombie!</h2>
      <p>Upload a clear photo of your face for best results</p>
      <form action="/generate" method="post" enctype="multipart/form-data" id="uploadForm">
        <input type="file" name="image" accept="image/*" required id="imageInput" />
        <div class="preview">
          <img id="imagePreview" style="display:none;" />
        </div>
        <br/>
        <button type="submit" id="submitBtn">🧟 Zombify Me!</button>
        <p id="status" style="margin-top: 15px; color: #7CFC00;"></p>
      </form>

      <script>
        const imageInput = document.getElementById('imageInput');
        const imagePreview = document.getElementById('imagePreview');
        const uploadForm = document.getElementById('uploadForm');
        const submitBtn = document.getElementById('submitBtn');
        const status = document.getElementById('status');

        imageInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              imagePreview.src = e.target.result;
              imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
          }
        });

        uploadForm.addEventListener('submit', (e) => {
          submitBtn.disabled = true;
          submitBtn.textContent = '🧟 Transforming...';
          status.textContent = 'This may take 30-60 seconds...';
        });
      </script>
    </body>
    </html>
  `);
});

// Generate zombie image route
app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No image uploaded.");
    }

    const fileName = req.file.filename;
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    
    console.log(`Processing: ${fileName}`);

    // Read and convert to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log("Starting zombie transformation...");

    // Using Flux Dev with image-to-image for face preservation
    const output = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          prompt: "zombie transformation, decaying flesh, pale dead skin, bloodshot red eyes, dark veins visible on face, sunken cheeks, undead creature, horror movie makeup, photorealistic, highly detailed face, scary, maintain face structure and features",
          image: imageDataUrl,
          prompt_strength: 0.75,  // 0.7-0.8 preserves face well
          num_inference_steps: 28,
          guidance_scale: 3.5,
          output_format: "png",
          output_quality: 90
        }
      }
    );

    console.log("Transformation complete!");

    const imageUrl = Array.isArray(output) ? output[0] : output;

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Send result page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>🧟 Your Zombie Transformation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            background: #1a1a1a;
            color: #fff;
          }
          h3 { color: #7CFC00; }
          img {
            max-width: 100%;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 0 20px rgba(124, 252, 0, 0.3);
          }
          a {
            display: inline-block;
            background: #7CFC00;
            color: #000;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 10px;
          }
          a:hover { background: #6FE000; }
          .download {
            background: #FF6B6B;
          }
          .download:hover { background: #FF5252; }
        </style>
      </head>
      <body>
        <h3>🧟 Your Zombie Transformation!</h3>
        <img src="${imageUrl}" alt="Zombie Version" />
        <br/>
        <a href="${imageUrl}" download="zombie-me.png" class="download">⬇ Download Image</a>
        <a href="/">🔄 Create Another</a>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);

    // Clean up
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            background: #1a1a1a;
            color: #fff;
          }
          h3 { color: #FF6B6B; }
          a {
            display: inline-block;
            background: #7CFC00;
            color: #000;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h3>⚠️ Transformation Failed</h3>
        <p>Error: ${error.message}</p>
        <p>Tips: Make sure your image shows a clear face and is under 10MB</p>
        <a href="/">Try Again</a>
      </body>
      </html>
    `);
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "zombie-transformer" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧟 Zombie Transformer running on http://localhost:${PORT}`);
  console.log(`📁 Make sure REPLICATE_API_TOKEN is set in your .env file`);
});