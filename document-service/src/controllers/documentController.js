const { prisma } = require('../config/db');
const { bucket } = require('../config/firebase');

// Controller to fetch all documents
const getDocuments = async (req, res) => {
  try {
    const { category, title, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const where = {};
    if (category) where.category = category;
    if (title) where.title = { contains: title, mode: 'insensitive' };

    const skip = (page - 1) * limit;
    const documents = await prisma.document.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { [sortBy]: order },
    });

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const uploadDocument = async (req, res) => {
  try {
    const { file } = req;
    const { title, category, version, revision, description } = req.body;
    const userId = req.user.userId;

    // Log incoming data
    console.log('Upload request received:', {
      title,
      category,
      version,
      revision,
      description,
      userId,
      file: file ? { originalname: file.originalname, size: file.size, bufferLength: file.buffer?.length } : 'No file',
    });

    // Validate input
    if (!file || !title || !category || !version || !revision || !description) {
      console.error('Missing required fields or file');
      return res.status(400).json({ error: 'All fields and file are required' });
    }

    // Check file buffer
    if (!file.buffer || file.buffer.length === 0) {
      console.error('File buffer is empty or undefined');
      return res.status(500).json({ error: 'File buffer missing or empty' });
    }
    console.log('File buffer size:', file.buffer.length);

    // Create a unique filename
    const fileName = `documents/${Date.now()}-${file.originalname}`;
    
    // Create a file in Firebase Storage
    const fileBuffer = Buffer.from(file.buffer);
    const fileUpload = bucket.file(fileName);
    
    // Set appropriate mime type
    const contentType = getContentType(file.originalname);
    
    // Upload the file to Firebase Storage
    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: contentType
      }
    });
    
    // Make the file publicly accessible
    await fileUpload.makePublic();
    
    // Get the public URL
    const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    // Save document to database
    const document = await prisma.document.create({
      data: {
        title,
        category,
        version,
        revision,
        description,
        fileUrl, // Store Firebase Storage URL in database
        createdBy: userId,
      },
    });

    res.status(201).json({ message: 'Document uploaded successfully', document });
  } catch (error) {
    console.error('Error uploading document:', error.message, error.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Helper function to determine content type
function getContentType(filename) {
  if (filename.endsWith('.pdf')) {
    return 'application/pdf';
  } else if (filename.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (filename.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (filename.endsWith('.png')) {
    return 'image/png';
  } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    return 'image/jpeg';
  } else {
    return 'application/octet-stream';
  }
}

module.exports = { getDocuments, uploadDocument };