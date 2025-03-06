import express from 'express';
import { getWord, postWord } from '../controllers/secretWord.js';

const router = express.Router();
router.route('/').get(getWord).post(postWord);

export default router;