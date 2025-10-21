import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";
import sharp from "sharp";

dotenv.config();

const app = express();

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
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zombie Face Transformer</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: transparent;
          color: #2d3748;
          padding: 20px;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }
        h2 {
          font-size: 2em;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .subtitle {
          color: #718096;
          font-size: 1em;
          margin-bottom: 30px;
          font-weight: 400;
        }
        .upload-container {
          background: #ffffff;
          border: 2px dashed #cbd5e0;
          border-radius: 16px;
          padding: 40px 30px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .upload-container:hover {
          border-color: #667eea;
          box-shadow: 0 8px 15px rgba(102, 126, 234, 0.1);
        }
        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          margin: 20px 0;
        }
        input[type="file"] {
          position: absolute;
          left: -9999px;
        }
        .file-input-label {
          display: inline-block;
          padding: 14px 28px;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
          color: #4a5568;
          transition: all 0.2s ease;
        }
        .file-input-label:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }
        .preview {
          margin: 25px 0;
          min-height: 60px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        #imagePreview {
          max-width: 100%;
          max-height: 350px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          display: none;
        }
        button[type="submit"] {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #ffffff;
          border: none;
          padding: 16px 40px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          width: 100%;
          max-width: 300px;
        }
        button[type="submit"]:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        button[type="submit"]:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        #status {
          margin-top: 20px;
          color: #667eea;
          font-weight: 500;
          min-height: 24px;
          font-size: 0.95em;
        }
        .icon {
          font-size: 2.5em;
          margin-bottom: 15px;
          filter: grayscale(20%);
        }
        .file-name {
          color: #48bb78;
          font-size: 0.9em;
          margin-top: 10px;
          font-weight: 500;
        }
        @media (max-width: 768px) {
          body {
            padding: 15px;
          }
          h2 {
            font-size: 1.6em;
          }
          .upload-container {
            padding: 30px 20px;
          }
          button[type="submit"] {
            padding: 14px 32px;
            font-size: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🧟</div>
        <h2>Zombie Face Transformer</h2>
        <p class="subtitle">Upload a clear photo of your face for best results</p>

        <form action="/generate" method="post" enctype="multipart/form-data" id="uploadForm">
          <div class="upload-container">
            <div class="file-input-wrapper">
              <input type="file" name="image" accept="image/*" required id="imageInput" />
              <label for="imageInput" class="file-input-label">
                📁 Choose Photo
              </label>
            </div>
            <div class="file-name" id="fileName"></div>
            <div class="preview">
              <img id="imagePreview" alt="Preview" />
            </div>
            <button type="submit" id="submitBtn">Transform into Zombie</button>
            <p id="status"></p>
          </div>
        </form>
      </div>

      <script>
        const imageInput = document.getElementById('imageInput');
        const imagePreview = document.getElementById('imagePreview');
        const uploadForm = document.getElementById('uploadForm');
        const submitBtn = document.getElementById('submitBtn');
        const status = document.getElementById('status');
        const fileName = document.getElementById('fileName');

        imageInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            fileName.textContent = '✓ ' + file.name;
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
          submitBtn.textContent = '⏳ Transforming...';
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

    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    const aspectRatio = originalWidth / originalHeight;

    // SDXL allowed dimensions
    const allowedDimensions = [
      [1024, 1024], [1152, 896], [1216, 832], [1344, 768],
      [1536, 640], [640, 1536], [768, 1344], [832, 1216], [896, 1152]
    ];

    // Find the best matching dimensions based on aspect ratio
    let bestDimension = allowedDimensions[0];
    let smallestDifference = Math.abs(aspectRatio - (bestDimension[0] / bestDimension[1]));

    for (const dim of allowedDimensions) {
      const dimRatio = dim[0] / dim[1];
      const difference = Math.abs(aspectRatio - dimRatio);
      if (difference < smallestDifference) {
        smallestDifference = difference;
        bestDimension = dim;
      }
    }

    console.log(`Resizing from ${originalWidth}x${originalHeight} to ${bestDimension[0]}x${bestDimension[1]}`);

    // Resize image to match SDXL requirements
    const resizedImageBuffer = await sharp(filePath)
      .resize(bestDimension[0], bestDimension[1], {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer();

    console.log("Starting zombie transformation with Stability AI...");

    // Using Stability AI's SDXL img2img for precise control
    const formData = new FormData();
    formData.append('init_image', resizedImageBuffer, {
      filename: fileName,
      contentType: 'image/png',
    });
    formData.append('init_image_mode', 'IMAGE_STRENGTH');
    formData.append('image_strength', '0.35'); // LOW strength = preserves original image heavily
    formData.append('text_prompts[0][text]', 'zombie face transformation,big and green eyes, large and sharp teeths, blood marks on face, scars on skin, photorealistic');
    formData.append('text_prompts[0][weight]', '1');
    formData.append('text_prompts[1][text]', 'different person, changed background, different clothes, cartoon, anime, blurry');
    formData.append('text_prompts[1][weight]', '-1');
    formData.append('cfg_scale', '7');
    formData.append('steps', '30');
    formData.append('samples', '1');

    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          ...formData.getHeaders(),
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stability AI error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    const imageUrl = `data:image/png;base64,${result.artifacts[0].base64}`;

    console.log("Transformation complete!");

    // Clean up uploaded file with delay to ensure all operations complete
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up: ${filePath}`);
        }
      } catch (err) {
        console.warn(`Could not delete file ${filePath}:`, err.message);
        // File will be cleaned up later or on next restart
      }
    }, 1000);

    // Send result page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Zombie Transformation</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: transparent;
            color: #2d3748;
            padding: 20px;
            text-align: center;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          h3 {
            font-size: 1.8em;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 30px;
          }
          .image-wrapper {
            background: #ffffff;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
          }
          img {
            max-width: 100%;
            border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
          }
          .button-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
          }
          a {
            display: inline-block;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }
          .download {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: #ffffff;
          }
          .download:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(72, 187, 120, 0.4);
          }
          .create-another {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
          }
          .create-another:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
          }
          @media (max-width: 768px) {
            h3 {
              font-size: 1.5em;
            }
            .button-group {
              flex-direction: column;
              align-items: center;
            }
            a {
              width: 100%;
              max-width: 300px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>🧟 Your Zombie Transformation!</h3>
          <div class="image-wrapper">
            <img src="${imageUrl}" alt="Zombie Version" />
          </div>
          <div class="button-group">
            <a href="${imageUrl}" download="zombie-me.png" class="download">⬇ Download Image</a>
            <a href="/" class="create-another">🔄 Create Another</a>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error("Error:", error.message);
    console.error("Full error:", error);

    // Clean up with proper error handling
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        setTimeout(() => {
          try {
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          } catch (unlinkErr) {
            console.warn('Cleanup warning:', unlinkErr.message);
          }
        }, 1000);
      } catch (err) {
        console.warn('Cleanup warning:', err.message);
      }
    }

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: transparent;
            color: #2d3748;
            padding: 20px;
            text-align: center;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
          }
          h3 {
            font-size: 1.8em;
            font-weight: 700;
            color: #e53e3e;
            margin-bottom: 20px;
          }
          .error-box {
            background: #fff5f5;
            border: 2px solid #feb2b2;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
          }
          .error-message {
            color: #c53030;
            font-weight: 500;
            margin-bottom: 15px;
          }
          .tips {
            color: #718096;
            line-height: 1.8;
            margin-top: 15px;
          }
          a {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            margin-top: 25px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
          }
          a:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>⚠️ Transformation Failed</h3>
          <div class="error-box">
            <div class="error-message">Error: ${error.message}</div>
            <div class="tips">
              <strong>Tips:</strong><br>
              • Make sure your image shows a clear face<br>
              • Image must be under 10MB<br>
              • Supported formats: JPG, PNG, WEBP
            </div>
          </div>
          <a href="/">← Try Again</a>
        </div>
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
  console.log(`📁 Make sure STABILITY_API_KEY is set in your .env file`);
  console.log(`🔑 Get your API key from https://platform.stability.ai/account/keys`);
});
