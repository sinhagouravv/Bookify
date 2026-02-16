const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');

// Force load dotenv
const envPath = path.resolve(__dirname, '../../.env');
const envExists = fs.existsSync(envPath);
require('dotenv').config({ path: envPath });

// In-memory status tracking
let syncStatus = {
    isSyncing: false,
    progress: 0,
    totalCategories: 0,
    processedCategories: 0,
    message: 'Idle'
};

exports.getSyncStatus = (req, res) => {
    res.json(syncStatus);
};

exports.syncBooksDebug = async (req, res) => {
    // If called via HTTP request, respond immediately
    if (res) res.json({ message: 'Sync started in background (Debug Mode)' });

    if (syncStatus.isSyncing) return; // Prevent concurrent syncs

    const fs = require('fs'); // Ensure fs is available here if needed (it is global constant above but fine)

    const log = (msg) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] ${msg}\n`;
        console.log(msg);
        fs.appendFile('sync.log', logMsg, (err) => { if (err) console.error(err); });
    };

    log(`DEBUG: .env path: ${envPath}`);
    log(`DEBUG: .env exists: ${envExists}`);
    if (envExists) {
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            log(`DEBUG: .env content preview: ${envContent.substring(0, 50)}...`);
        } catch (err) {
            log(`DEBUG: Error reading .env: ${err.message}`);
        }
    }
    log(`DEBUG: GOOGLE_API_KEY value: ${process.env.GOOGLE_API_KEY ? 'SET' : 'UNSET'}`);

    // Fallback if env var fails
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyAxS3zcRljmlkzNgYLsYb8remae572AIAI';

    if (!process.env.GOOGLE_API_KEY) {
        log('WARNING: Using hardcoded API key fallback to bypass env issue.');
    }

    const categories = [
        'subject:Science Fiction', 'subject:Self-Help', 'subject:Thriller', 'subject:Biography', 'subject:Classic',
        'subject:Fantasy', 'subject:History', 'subject:Programming', 'subject:Psychology', 'subject:Romance',
        'subject:Business & Economics', 'subject:Philosophy', 'subject:Health & Fitness', 'subject:Travel & Adventure', 'subject:Poetry',
        'subject:Children’s Books', 'subject:Mystery & Detective', 'subject:Comics & Graphic Novels', 'subject:Cooking & Food', 'subject:Art & Photography'
    ];


    // Initialize Sync Status
    syncStatus = {
        isSyncing: true,
        progress: 0,
        totalCategories: categories.length,
        processedCategories: 0,
        message: 'Starting synchronization...'
    };

    log('Starting book synchronization (Debug)...');

    if (!GOOGLE_API_KEY) {
        log('ERROR: GOOGLE_BOOK_SECRET is not set or empty.');
        syncStatus.isSyncing = false;
        syncStatus.message = 'Error: API Key missing';
        return;
    }

    try {
        const BATCH_SIZE = 3;
        const DELAY_MS = 1000; // Slower delay for sync to be safe
        let processedCount = 0;

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < categories.length; i += BATCH_SIZE) {
            const batch = categories.slice(i, i + BATCH_SIZE);

            // Update status message
            const currentCatNames = batch.map(c => c.replace('subject:', '')).join(', ');
            syncStatus.message = `Syncing: ${currentCatNames}...`;

            const batchRequests = batch.map(cat =>
                axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cat)}&maxResults=1&key=${GOOGLE_API_KEY}`, {
                    headers: {
                        'Referer': 'http://localhost:5173',
                        'Origin': 'http://localhost:5173'
                    }
                })
                    .then(response => {
                        log(`Successfully fetched ${cat}: ${response.data.totalItems} items found.`);
                        return { response, category: cat.replace('subject:', '') };
                    })
                    .catch(e => {
                        log(`Failed to fetch ${cat}: ${e.message}`);
                        if (e.response) log(`Error details: ${JSON.stringify(e.response.data)}`);
                        return { data: { items: [] }, category: cat };
                    })
            );

            const batchResponses = await Promise.all(batchRequests);

            for (const { response, category } of batchResponses) {
                if (response.data && response.data.items) {
                    for (const item of response.data.items) {
                        try {
                            const info = item.volumeInfo;
                            const bookData = {
                                googleId: item.id,
                                title: info.title,
                                author: info.authors ? info.authors[0] : 'Unknown',
                                category: category, // Strictly use the requested category
                                description: info.description ? info.description.substring(0, 150) + '...' : 'No description available.',
                                fullDescription: info.description || 'No description available.',
                                image: info.imageLinks ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail).replace('http:', 'https:').replace('&edge=curl', '') : null,
                                quantity: 10, // Default for now
                                available: Math.floor(Math.random() * 10) + 1
                            };

                            // Upsert: Update if exists, Insert if not
                            await Book.findOneAndUpdate({ googleId: item.id }, bookData, { upsert: true, new: true });
                            processedCount++;
                        } catch (dbErr) {
                            log(`DB Error for item ${item.id}: ${dbErr.message}`);
                        }
                    }
                }
            }

            // Update progress
            syncStatus.processedCategories += batch.length;
            syncStatus.progress = Math.round((syncStatus.processedCategories / syncStatus.totalCategories) * 100);

            log(`Synced batch ${i / BATCH_SIZE + 1}/${Math.ceil(categories.length / BATCH_SIZE)}`);
            if (i + BATCH_SIZE < categories.length) {
                await delay(DELAY_MS);
            }
        }
        log(`Book synchronization complete. Processed ${processedCount} books.`);

        syncStatus.message = 'Synchronization complete!';
        syncStatus.progress = 100;
        setTimeout(() => {
            syncStatus.isSyncing = false;
        }, 2000); // Keep complete status for 2s before resetting

    } catch (error) {
        log(`Error during book synchronization: ${error.message}`);
        syncStatus.isSyncing = false;
        syncStatus.message = `Error: ${error.message}`;
    }
};
