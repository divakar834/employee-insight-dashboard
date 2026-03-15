/**
 * imageMerge.js
 * ──────────────────────────────────────────────────────────────────
 * Utility to composite the captured photo and the signature canvas
 * into a single downloadable image using the HTML5 Canvas API.
 *
 * Steps:
 *  1. Create an off-screen canvas matching the photo dimensions.
 *  2. Draw the photo onto it.
 *  3. Draw the signature canvas on top (semi-transparent overlay area).
 *  4. Export as a PNG data URL via canvas.toDataURL().
 */

/**
 * mergePhotoAndSignature
 *
 * @param {HTMLVideoElement|HTMLCanvasElement} photoSource
 *   The source to draw as the background (video frame or existing canvas).
 * @param {HTMLCanvasElement} signatureCanvas
 *   The canvas containing the user's signature.
 * @param {number} photoWidth  - width of the output image
 * @param {number} photoHeight - height of the output image
 * @returns {string} PNG data URL of the merged image
 */
export function mergePhotoAndSignature(photoSource, signatureCanvas, photoWidth, photoHeight) {
  // 1. Create a fresh off-screen canvas
  const mergeCanvas    = document.createElement('canvas')
  mergeCanvas.width    = photoWidth
  mergeCanvas.height   = photoHeight
  const ctx            = mergeCanvas.getContext('2d')

  // 2. Draw the background photo / video frame
  ctx.drawImage(photoSource, 0, 0, photoWidth, photoHeight)

  // 3. Draw a semi-transparent dark strip at the bottom for the signature
  const sigH = photoHeight * 0.3          // bottom 30% of the image
  const sigY = photoHeight - sigH
  ctx.fillStyle = 'rgba(13, 13, 13, 0.55)'
  ctx.fillRect(0, sigY, photoWidth, sigH)

  // 4. Draw the signature canvas scaled into the strip
  ctx.drawImage(
    signatureCanvas,
    0, 0, signatureCanvas.width, signatureCanvas.height, // source rect
    0, sigY, photoWidth, sigH                            // destination rect
  )

  // 5. Watermark / label
  ctx.fillStyle    = 'rgba(110, 231, 183, 0.7)'
  ctx.font         = '13px JetBrains Mono, monospace'
  ctx.fillText('EID · Signed', 12, sigY + 18)

  // 6. Export
  return mergeCanvas.toDataURL('image/png')
}
