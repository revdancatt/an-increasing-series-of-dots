/* global preloadImagesTmr $fx fxpreview fxhash fxrand */
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

const ratio = 1 // canvas ratio
const features = {} //  so we can keep track of what we're doing
const nextFrame = null // requestAnimationFrame, and the ability to clear it
let resizeTmr = null // a timer to make sure we don't resize too often
let highRes = false // display high or low res
let drawStarted = false // Flag if we have kicked off the draw loop
let thumbnailTaken = false
let forceDownloaded = false
const urlSearchParams = new URLSearchParams(window.location.search)
const urlParams = Object.fromEntries(urlSearchParams.entries())
const prefix = 'an_increasing_series_of_dots'
// dumpOutputs will be set to false unless we have ?dumpOutputs=true in the URL
const dumpOutputs = urlParams.dumpOutputs === 'true'
const maxIterations = 64
// const startTime = new Date().getTime()

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

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawStarted = true
  // Grab all the canvas stuff
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

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Below is code that is common to all the projects, there may be some
  // customisation for animated work or special cases

  // Try various methods to tell the parent window that we've drawn something
  if (!thumbnailTaken) {
    try {
      $fx.preview()
    } catch (e) {
      try {
        fxpreview()
      } catch (e) {
      }
    }
    thumbnailTaken = true
  }

  // If we are forcing download, then do that now
  if (dumpOutputs || ('forceDownload' in urlParams && forceDownloaded === false)) {
    forceDownloaded = 'forceDownload' in urlParams
    await autoDownloadCanvas()
    // Tell the parent window that we have downloaded
    window.parent.postMessage('forceDownloaded', '*')
  } else {
    //  We should wait for the next animation frame here
    // nextFrame = window.requestAnimationFrame(drawCanvas)
  }
  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// These are the common functions that are used by the canvas that we use
// across all the projects, init sets up the resize event and kicks off the
// layoutCanvas function.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

//  Call this to start everything off
const init = async () => {
  // Resize the canvas when the window resizes, but only after 100ms of no resizing
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

//  This is where we layout the canvas, and redraw the textures
const layoutCanvas = async (windowObj = window, urlParamsObj = urlParams) => {
  //  Kill the next animation frame (note, this isn't always used, only if we're animating)
  windowObj.cancelAnimationFrame(nextFrame)

  //  Get the window size, and devicePixelRatio
  const { innerWidth: wWidth, innerHeight: wHeight, devicePixelRatio = 1 } = windowObj
  let dpr = devicePixelRatio
  let cWidth = wWidth
  let cHeight = cWidth * ratio

  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }

  // Grab any canvas elements so we can delete them
  const canvases = document.getElementsByTagName('canvas')
  Array.from(canvases).forEach(canvas => canvas.remove())

  // Now set the target width and height
  let targetHeight = highRes ? 4096 : cHeight
  let targetWidth = targetHeight / ratio

  //  If the alba params are forcing the width, then use that (only relevant for Alba)
  if (windowObj.alba?.params?.width) {
    targetWidth = window.alba.params.width
    targetHeight = Math.floor(targetWidth * ratio)
  }

  // If *I* am forcing the width, then use that, and set the dpr to 1
  // (as we want to render at the exact size)
  if ('forceWidth' in urlParams) {
    targetWidth = parseInt(urlParams.forceWidth)
    targetHeight = Math.floor(targetWidth * ratio)
    dpr = 1
  }

  // Update based on the dpr
  targetWidth *= dpr
  targetHeight *= dpr

  //  Set the canvas width and height
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth
  canvas.height = targetHeight
  document.body.appendChild(canvas)

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Custom code (for defining textures and buffer canvas goes here) if needed
  //

  //  Re-Create the paper pattern
  drawCanvas()
}

//  This allows us to download the canvas as a PNG
// If we are forcing the id then we add that to the filename
const autoDownloadCanvas = async () => {
  const canvas = document.getElementById('target')

  // Create a download link
  const element = document.createElement('a')
  const filename = 'forceId' in urlParams
    ? `${prefix}_${urlParams.forceId.toString().padStart(4, '0')}_${fxhash}`
    : `${prefix}_${fxhash}`
  element.setAttribute('download', filename)

  // Hide the link element
  element.style.display = 'none'
  document.body.appendChild(element)

  // Convert canvas to Blob and set it as the link's href
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob))

  // Trigger the download
  element.click()

  // Clean up by removing the link element
  document.body.removeChild(element)

  // Reload the page if dumpOutputs is true
  if (dumpOutputs) {
    window.location.reload()
  }
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // == Common controls ==
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }

  // Custom controls
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  Normally we would have a test
  // if (true === true) {
  if (!drawStarted) {
    clearInterval(preloadImagesTmr)
    init()
  }
}

console.table(window.$fxhashFeatures)
