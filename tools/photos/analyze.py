import glob, json, os, re, subprocess, sys, tempfile
import cv2, numpy as np, imagehash
from PIL import Image, ImageOps
net=cv2.dnn.readNetFromCaffe('/home/claude/models/deploy.prototxt','/home/claude/models/res10_300x300_ssd_iter_140000.caffemodel')
files=sorted(glob.glob('/home/claude/photos1/*/*'))+sorted(glob.glob('/home/claude/photos2/*/*'))
def faces_of(bgr,thr=0.5):
    H,W=bgr.shape[:2]; out=[]
    scale=min(1.0,2400/max(W,H)); img=cv2.resize(bgr,None,fx=scale,fy=scale) if scale<1 else bgr
    h,w=img.shape[:2]; tiles=[(0,0,w,h)]
    th,tw=int(h*0.55),int(w*0.55)
    for y in (0,h-th):
        for x in (0,w-tw): tiles.append((x,y,tw,th))
    cx,cy=(w-tw)//2,(h-th)//2; tiles.append((cx,cy,tw,th))
    for (x,y,tw_,th_) in tiles:
        crop=img[y:y+th_,x:x+tw_]
        blob=cv2.dnn.blobFromImage(cv2.resize(crop,(300,300)),1.0,(300,300),(104,177,123))
        net.setInput(blob); d=net.forward()
        for i in range(d.shape[2]):
            c=float(d[0,0,i,2])
            if c<thr: continue
            x1,y1,x2,y2=d[0,0,i,3:7]
            bx=(x+x1*tw_)/scale; by=(y+y1*th_)/scale; bw=(x2-x1)*tw_/scale; bh=(y2-y1)*th_/scale
            if bw<8 or bh<8 or bw>0.5*W: continue
            out.append([bx,by,bw,bh,c])
    # NMS
    if not out: return []
    boxes=[[int(b[0]),int(b[1]),int(b[2]),int(b[3])] for b in out]; sc=[b[4] for b in out]
    idx=cv2.dnn.NMSBoxes(boxes,sc,thr,0.3)
    return [[*boxes[i],sc[i]] for i in np.array(idx).flatten()]
def stamp_top(path):
    im=ImageOps.exif_transpose(Image.open(path)).convert('L'); W,H=im.size
    s=1400/W if W>1400 else 1.0; im=im.resize((int(W*s),int(H*s)))
    y0=int(im.size[1]*0.5); strip=im.crop((0,y0,im.size[0],im.size[1]))
    with tempfile.NamedTemporaryFile(suffix='.png') as t:
        strip.save(t.name); r=subprocess.run(['tesseract',t.name,'-','--psm','11','tsv'],capture_output=True,text=True).stdout
    ys=[]
    for line in r.splitlines()[1:]:
        p=line.split('\t')
        if len(p)>=12 and re.search(r'(India|Lat\b|Long\b|GMT|Odisha|Telangana|Rangareddy|Gunupur|PM|AM)',p[11]) and float(p[10] if p[10] else 0)>30: ys.append(int(p[7]))
    if not ys: return None
    return (y0+min(ys))/s/H   # fraction of height where stamp text begins
res=[]
for i,f in enumerate(files):
    im=ImageOps.exif_transpose(Image.open(f)).convert('RGB'); W,H=im.size
    top=im.crop((0,0,W,int(H*0.7)))
    bgr=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR)
    fc=faces_of(bgr)
    lap=cv2.Laplacian(cv2.cvtColor(np.array(top.resize((800,int(800*top.size[1]/top.size[0])))),cv2.COLOR_RGB2GRAY),cv2.CV_64F).var()
    res.append({'i':i,'path':f,'name':os.path.basename(f),'folder':'A' if '/photos1/' in f else 'B','W':W,'H':H,
      'dt':(Image.open(f).getexif().get(306) or ''),'dhash':str(imagehash.dhash(top,hash_size=12)),'faces':fc,'sharp':round(lap,1),'stamp_top':stamp_top(f)})
    if i%20==0: print(i,len(fc),res[-1]['stamp_top'],flush=True)
json.dump(res,open('analysis.json','w'))
print('done',len(res))
