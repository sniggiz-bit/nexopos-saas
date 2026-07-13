import cv2
import numpy as np
import sys
import os

def composite():
    base_img_path = r"c:\Users\user\Desktop\nexopos.cl\apps\web\public\dashboard-hero-nexopos.png"
    pos_imgs = [
        r"c:\Users\user\Downloads\pos nexopos.cl.png",
        r"c:\Users\user\Downloads\img pos nexps.png",
        r"c:\Users\user\Downloads\pos.png"
    ]
    
    pos_img_path = None
    for p in pos_imgs:
        if os.path.exists(p):
            pos_img_path = p
            break
            
    if not pos_img_path:
        print("POS image not found in Downloads!")
        return

    base = cv2.imread(base_img_path)
    pos = cv2.imread(pos_img_path)

    # Let's try to detect the screen area. The screen in the iMac photo is a large dark rectangle.
    # Convert to grayscale
    gray = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY)
    
    # Thresholding for dark regions. The screen is dark.
    _, thresh = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort by area
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    screen_contour = None
    for cnt in contours:
        epsilon = 0.02 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        
        # We look for a 4-sided polygon
        if len(approx) == 4:
            area = cv2.contourArea(cnt)
            if area > 10000: # Make sure it's reasonably large
                screen_contour = approx
                break

    if screen_contour is None:
        print("Could not automatically detect the screen. Using fallback coordinates.")
        # Fallback roughly based on a standard centered iMac mockup
        h, w = base.shape[:2]
        pts_dst = np.array([
            [w*0.15, h*0.1],
            [w*0.85, h*0.1],
            [w*0.85, h*0.7],
            [w*0.15, h*0.7]
        ], dtype="float32")
    else:
        print("Screen detected!")
        # Sort points: top-left, top-right, bottom-right, bottom-left
        pts = screen_contour.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        pts_dst = rect
        
        # Let's shrink the destination slightly to keep the black bezel
        center = np.mean(pts_dst, axis=0)
        pts_dst = center + (pts_dst - center) * 0.98

    # The source points (the POS screenshot)
    h_pos, w_pos = pos.shape[:2]
    pts_src = np.array([
        [0, 0],
        [w_pos, 0],
        [w_pos, h_pos],
        [0, h_pos]
    ], dtype="float32")

    # Compute perspective transform matrix
    M = cv2.getPerspectiveTransform(pts_src, pts_dst)

    # Warp the POS image
    warped_pos = cv2.warpPerspective(pos, M, (base.shape[1], base.shape[0]))

    # Create a mask for the warped image
    mask = np.zeros((base.shape[0], base.shape[1]), dtype=np.uint8)
    cv2.fillConvexPoly(mask, np.int32(pts_dst), 255)

    # Inverse mask
    mask_inv = cv2.bitwise_not(mask)

    # Black-out the area of the screen in the base image
    base_bg = cv2.bitwise_and(base, base, mask=mask_inv)

    # Add the warped POS image
    result = cv2.add(base_bg, warped_pos)

    out_path = r"c:\Users\user\Desktop\nexopos.cl\apps\web\public\dashboard-hero-nexopos.png"
    
    # Save a backup first
    if not os.path.exists(out_path + ".bak"):
        import shutil
        shutil.copy(out_path, out_path + ".bak")

    cv2.imwrite(out_path, result)
    print("Success! Image composited and saved.")

if __name__ == '__main__':
    composite()
