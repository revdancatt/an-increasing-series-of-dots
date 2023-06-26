/* global preloadImagesTmr $fx fxhash fxrand */
//
//  fxhash - An Increasing Series of Dots
//
//  If I had longer, this code would be cleaner
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

const ratio = 1 / 1
// const startTime = new Date().getTime() // so we can figure out how long since the scene started
let drawn = false
let highRes = false // display high or low res
const features = {}
const nextFrame = null
let resizeTmr = null
const maxIterations = 64
let thumbnailTaken = false
const dumpOutputs = false

window.$fxhashFeatures = {}

const palette = [
  {
    background: '#FEFFFA',
    foreground: ['#86B1AC', '#139699', '#FA4200', '#03161F']
  },
  {
    background: '#F5E8D1',
    foreground: ['#FFDC53', '#E54A30', '#E0C095', '#B7CB92', '#5F7B7A', '#678C91']
  },
  {
    background: '#D9DBD0',
    foreground: ['#E9BA4E', '#E54A30', '#A3C395', '#678C91']
  },

  {
    background: '#86B1AC',
    foreground: ['#22272D', '#F5E8D1', '#FEFFFA', '#9D8B48']
  },

  {
    background: '#139699',
    foreground: ['#FBF4E8', '#E9BA4E', '#A3C395', '#E57F34']
  },
  {
    background: '#FA4200',
    foreground: ['#0C0A04', '#FEFFFA']
  },
  {
    background: '#03161F',
    foreground: ['#C9DBE3', '#739094', '#A3C395']
  }
]

//  Work out what all our features are
const makeFeatures = () => {
  const iterations = $fx.iteration === undefined ? Math.floor(fxrand() * maxIterations) + 1 : $fx.iteration
  // const iterations = 64
  // Create the human readable features object
  const featuresObject = {}

  // Now we are going to create the segments, the first one is going to the pageSize then taking into account the margins
  let failed = true
  let escapeCounter = 0
  while (failed && escapeCounter < 1000) {
    failed = false
    escapeCounter++
    const segments = []
    const thisSegment = {
      left: 0,
      right: 1,
      top: 0,
      bottom: 1
    }
    thisSegment.width = thisSegment.right - thisSegment.left
    thisSegment.height = thisSegment.bottom - thisSegment.top
    segments.push(thisSegment)
    // Now while the number of segments is less than the number of subdivisions we want, we'll keep splitting them
    while (segments.length < iterations) {
      // Randomly pick a segment to split
      const segmentToSplit = Math.floor(fxrand() * segments.length)
      let horizontalSplitChance = 0.85
      // Work out if the segment is wider than it is tall, if set the horizontal split chance to 0.333
      if (segments[segmentToSplit].width > segments[segmentToSplit].height) horizontalSplitChance = 1 - horizontalSplitChance
      // Decide if we are going to split it horizontally or vertically
      if (fxrand() < horizontalSplitChance) {
        // Split it horizontally, anywhere from 15% to 85% of the way down
        const splitPoint = segments[segmentToSplit].top + (segments[segmentToSplit].height * (0.15 + (fxrand() * 0.7)))
        // Now create two new segments
        const newSegment1 = {
          left: segments[segmentToSplit].left,
          right: segments[segmentToSplit].right,
          top: segments[segmentToSplit].top,
          bottom: splitPoint
        }
        newSegment1.width = newSegment1.right - newSegment1.left
        newSegment1.height = newSegment1.bottom - newSegment1.top
        const newSegment2 = {
          left: segments[segmentToSplit].left,
          right: segments[segmentToSplit].right,
          top: splitPoint,
          bottom: segments[segmentToSplit].bottom
        }
        newSegment2.width = newSegment2.right - newSegment2.left
        newSegment2.height = newSegment2.bottom - newSegment2.top
        // remove the old segment
        segments.splice(segmentToSplit, 1, newSegment1, newSegment2)
      } else {
        // Split it vertically, anywhere from 15% to 85% of the way across
        const splitPoint = segments[segmentToSplit].left + (segments[segmentToSplit].width * (0.15 + (fxrand() * 0.7)))
        // Now create two new segments
        const newSegment1 = {
          left: segments[segmentToSplit].left,
          right: splitPoint,
          top: segments[segmentToSplit].top,
          bottom: segments[segmentToSplit].bottom
        }
        newSegment1.width = newSegment1.right - newSegment1.left
        newSegment1.height = newSegment1.bottom - newSegment1.top
        const newSegment2 = {
          left: splitPoint,
          right: segments[segmentToSplit].right,
          top: segments[segmentToSplit].top,
          bottom: segments[segmentToSplit].bottom
        }
        newSegment2.width = newSegment2.right - newSegment2.left
        newSegment2.height = newSegment2.bottom - newSegment2.top
        // remove the old segment
        segments.splice(segmentToSplit, 1, newSegment1, newSegment2)
      }
    }

    // Now that we have the segments I want to go through and add a circle to them
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      // Work out which is narrower, the width or the height
      const narrowest = Math.min(segment.width, segment.height)
      // Now set the radius to be 95% of the narrowest
      const radius = (narrowest / 2) * 0.95
      // Now we want to work out where the centre of the circle is, so we'll pick a random point within the segment
      // so that the circle is always fully contained within the segment and always 2.5% away from the edge
      const centreX = segment.left + ((segment.width - narrowest) * fxrand()) + (narrowest / 2)
      const centreY = segment.top + ((segment.height - narrowest) * fxrand()) + (narrowest / 2)
      // Record the centre and radius in the segment
      segment.dot = {
        x: centreX,
        y: centreY,
        radius
      }
      // Calculate all the segments that this segment is touching
      const touchingSegments = []
      // debugger
      for (let j = 0; j < segments.length; j++) {
        if (i !== j) {
          // Check if the segment is adjacent to this one, if so add it to the touchingSegments array
          if (segments[j].left === segment.right || segments[j].right === segment.left || segments[j].top === segment.bottom || segments[j].bottom === segment.top) {
            touchingSegments.push(j)
          }
        }
      }
      // Now grab the used colours from those segments
      const usedColours = []
      for (let j = 0; j < touchingSegments.length; j++) {
        // If the segment has a colour
        if (segments[touchingSegments[j]].colour) {
          // Add it to the usedColours array if it isn't already in there
          if (usedColours.indexOf(segments[touchingSegments[j]].colour) === -1) usedColours.push(segments[touchingSegments[j]].colour)
        }
      }
      // Now grab the nodes from the palette that aren't in the usedColours array
      const validColours = []
      for (let j = 0; j < palette.length; j++) {
        if (usedColours.indexOf(palette[j].background) === -1) validColours.push(palette[j])
      }
      // Now pick a random colour from the validColours array
      if (validColours.length === 0) {
        // If there are no valid colours, then set the colour to be black
        segment.colour = palette[Math.floor(fxrand() * palette.length)].background
        failed = true
      } else {
        segment.colour = validColours[Math.floor(fxrand() * validColours.length)].background
        // Now grab the node from the palettes that match this background colour
        const node = palette.find(node => node.background === segment.colour)
        // Pick a random foreground colour from the node for the circle
        segment.dot.colour = node.foreground[Math.floor(fxrand() * node.foreground.length)]
      }
    }

    features.segments = segments
  }
  featuresObject.Dots = features.segments.length
  $fx.features(featuresObject)
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()

const init = async () => {
  //  I should add a timer to this, but really how often to people who aren't
  //  the developer resize stuff all the time. Stick it in a digital frame and
  //  have done with it!
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

const layoutCanvas = async () => {
  //  Kill the next animation frame
  window.cancelAnimationFrame(nextFrame)

  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  const canvas = document.getElementById('target')
  if (highRes) {
    canvas.height = 8192
    canvas.width = 8192 / ratio
  } else {
    canvas.width = Math.min((8192 / 2), cWidth * 2)
    canvas.height = Math.min((8192 * ratio / 2), cHeight * 2)
    //  Minimum size to be half of the high rez cersion
    if (Math.min(canvas.width, canvas.height) < 8192 / 2) {
      if (canvas.width < canvas.height) {
        canvas.height = 8192 / 2
        canvas.width = 8192 / 2 / ratio
      } else {
        canvas.width = 8192 / 2
        canvas.height = 8192 / 2 / ratio
      }
    }
  }

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  //  And draw it!!
  drawCanvas()
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawn = true
  //  Make sure there's only one nextFrame to be called
  window.cancelAnimationFrame(nextFrame)

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#999999'
  ctx.fillRect(0, 0, w, h)

  // We need to set the default line width, which will be the canvas height divided my the pageSize height times two
  // This is to represent roughly a line width of 0.5mm on an A3 page
  ctx.lineWidth = w / 800
  // Now loop through the segments and draw the bounding boxes
  features.segments.forEach(segment => {
    // Set the stroke colour
    ctx.fillStyle = segment.colour
    ctx.strokeStyle = segment.colour
    // Now make the rectangle fill and stroke it
    ctx.beginPath()
    ctx.rect(segment.left * w, segment.top * h, segment.width * w, segment.height * h)
    ctx.fill()
    ctx.stroke()

    // Draw the bounding box
    // ctx.strokeRect(segment.left * w, segment.top * h, segment.width * w, segment.height * h)
    // Draw the circle
    ctx.fillStyle = segment.dot.colour
    ctx.beginPath()
    ctx.arc(segment.dot.x * w, segment.dot.y * h, segment.dot.radius * w, 0, 2 * Math.PI)
    ctx.fill()
  })

  if (!thumbnailTaken) {
    $fx.preview()
    thumbnailTaken = true
  }
}

const autoDownloadCanvas = async (showHash = false) => {
  const element = document.createElement('a')
  element.setAttribute('download', `an_increasing_series_of_dots_${fxhash}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  let imageBlob = null
  imageBlob = await new Promise(resolve => document.getElementById('target').toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob, {
    type: 'image/png'
  }))
  element.click()
  document.body.removeChild(element)
  // If we are dumping outputs then reload the page
  if (dumpOutputs) {
    window.location.reload()
  }
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  If paper1 has loaded and we haven't draw anything yet, then kick it all off
  if (!drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
