import express from 'express';
import * as terminalController from '../controllers/terminalController.js';

const router = express.Router();

router.post('/start', terminalController.startTerminal);

export default router;
