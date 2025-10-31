import express from 'express';
import * as filesController from '../controllers/filesController.js';

const router = express.Router();

router.get('/tree', filesController.getFileTree);
router.get('/', filesController.readFile);
router.put('/', filesController.updateFile);
router.post('/', filesController.createFile);
router.delete('/', filesController.deleteFile);
router.patch('/rename', filesController.renameFile);

export default router;
