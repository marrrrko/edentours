import Cookies from 'cookies'
import { getTour, updateTour } from '../../../db/bookingDb'

export default async function handler(req, res) {
  const cookies = new Cookies(req, res)
  const accessCookie = cookies.get('edenaccess')
  
  if (accessCookie != process.env.ADMIN_ACCESS) {
    res.statusCode = 401
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ msg: 'No access' }))
    return
  }

  if (req.method === 'DELETE') {
    const { tourId, reverse } = req.query
    const tour = await getTour(tourId)

    const updatedTour = {
      ...tour,
      cancelled: !reverse
    }

    await updateTour(tour.eventTime, updatedTour)
    

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ updatedTour }))
  } else {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ msg: 'No op' }))
    return
  }
}
