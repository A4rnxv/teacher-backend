require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Create the app
const app = express();

// CORS middleware (should be placed early in the code)
app.use(cors());

// Server config
const PORT = process.env.PORT || 10000;

// --- Middleware ---
app.use(express.json());

// --- MongoDB connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// --- Schema & Model ---
const competitionSchema = new mongoose.Schema({
  eventName:        { type: String, required: true },
  classGroup:       { type: String, required: true },
  dayDate:          { type: String, required: true },
  venue:            { type: String, required: true },
  shortDescription: { type: String, required: true },
  registrationLink: { type: String, required: true },
}, {
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret._id = ret._id.toString();
      delete ret.id;
    }
  }
});

const Competition = mongoose.model('Competition', competitionSchema);

// --- Routes ---
app.get('/', (_req, res) => {
  res.send('LVIS Competitions API is running.');
});

app.get('/api/competitions', async (_req, res) => {
  try {
    const comps = await Competition.find().lean();
    res.json(comps);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

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

// Add after existing schema
const houseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  score: { type: Number, default: 0 },
  imageUrl: { type: String, required: true } // same image used on house page
});

const House = mongoose.model('House', houseSchema);

// Get all house scores
app.get('/api/houses', async (_req, res) => {
  const houses = await House.find().sort({ score: -1 });
  res.json(houses);
});

// Update house score
app.post('/api/houses/:name/add', async (req, res) => {
  const { name } = req.params;
  const { points } = req.body;

  const house = await House.findOneAndUpdate(
    { name },
    { $inc: { score: points } },
    { new: true }
  );
  if (!house) return res.status(404).json({ error: 'House not found' });

  res.json(house);
});

// Temporary seeding route
//app.get('/seed-houses', async (_req, res) => {
  //const houses = [
    //{
    //  name: 'Gandhi',
    //  score: 0,
    //  imageUrl: 'gandhi.png'
    //},
    //{
     // name: 'Nehru',
    //  score: 0,
    //  imageUrl: 'nehru.png'
    //},
    //{
    //  name: 'Tagore',
    //  score: 0,
    //  imageUrl: 'tagore.png'
    //},
    //{
     // name: 'Teresa',
      //score: 0,
     // imageUrl: 'teresa.png'
    //}
  //];
  
  try {
    await House.deleteMany({});
    await House.insertMany(houses);
    res.send('Houses seeded successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Seeding failed');
  }
});

// --- Start server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
