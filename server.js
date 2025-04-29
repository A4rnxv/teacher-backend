// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB connection ---
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((error) => console.log('MongoDB connection error:', error));

// --- Schema & Model ---
const competitionSchema = new mongoose.Schema({
  eventName:       { type: String, required: true },
  classGroup:      { type: String, required: true },
  dayDate:         { type: String, required: true },
  venue:           { type: String, required: true },
  shortDescription:{ type: String, required: true },
  registrationLink:{ type: String, required: true },
}, {
  toJSON: {
    virtuals:   true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret._id = ret._id.toString();
      delete ret.id;
    }
  }
});

const Competition = mongoose.model('Competition', competitionSchema);

// --- Routes ---

// Basic landing route (avoid 404 on GET /)
app.get('/', (_req, res) => {
  res.send('LVIS Competitions API is running.');
});

// Get all competitions
app.get('/api/competitions', async (_req, res) => {
  try {
    const comps = await Competition.find().lean();
    res.json(comps);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Create new competition
app.post('/api/competitions', async (req, res) => {
  try {
    const newComp = new Competition(req.body);
    await newComp.save();
    res.status(201).json(newComp);
  } catch (err) {
    console.error('Create error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update competition by ID
app.put('/api/competitions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await Competition.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Competition not found' });
    res.json(updated);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update competition' });
  }
});

// Delete competition by ID
app.delete('/api/competitions/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting competition with ID: ${id}`);
  try {
    const deleted = await Competition.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Competition not found' });
    res.json({ message: 'Competition deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete competition' });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on https://teacher-backend-4d3v.onrender.com/`);
});
