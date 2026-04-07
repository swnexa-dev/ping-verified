import express from 'express'
import { getEvents } from '../services/events.service.js'

const router = express.Router()

router.get('/', (req, res) => {
  res.json(getEvents())
})

export default router
