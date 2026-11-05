import json, cv2, numpy as np
from PIL import Image, ImageOps
net=cv2.dnn.readNetFromCaffe('/home/claude/models/deploy.prototxt','/home/claude/models/res10_300x300_ssd_iter_140000.caffemodel')
prof=cv2.CascadeClassifier(cv2.data.haarcascades+'haarcascade_profileface.xml')
r=json.load(open('analysis.json')); MARGIN=0.10
def detect(img,thr=0.30):
    h,w=img.shape[:2]; out=[]
    tw,th=int(w*0.34),int(h*0.55); xs=np.linspace(0,w-tw,5).astype(int); ys=np.linspace(0,h-th,3).astype(int)
    for y in ys:
        for x in xs:
            crop=img[y:y+th,x:x+tw]
            net.setInput(cv2.dnn.blobFromImage(cv2.resize(crop,(300,300)),1.0,(300,300),(104,177,123))); d=net.forward()
            for i in range(d.shape[2]):
                c=float(d[0,0,i,2])
                if c<thr: continue
                x1,y1,x2,y2=d[0,0,i,3:7]; bw=(x2-x1)*tw; bh=(y2-y1)*th
                if bw<6 or bh<6 or bw>0.25*w or not(0.6<bw/bh<1.5 if bh>0 else False): continue
                out.append([x+x1*tw,y+y1*th,bw,bh,c])
    g=cv2.equalizeHist(cv2.cvtColor(img,cv2.COLOR_BGR2GRAY))
    for flip in (False,True):
        gg=cv2.flip(g,1) if flip else g
        for (x,y,bw,bh) in prof.detectMultiScale(gg,1.1,6,minSize=(14,14)):
            out.append([(w-x-bw) if flip else x,y,bw,bh,0.35])
    if not out: return []
    boxes=[[int(b[0]),int(b[1]),int(b[2]),int(b[3])] for b in out]; sc=[b[4] for b in out]
    idx=cv2.dnn.NMSBoxes(boxes,sc,0.25,0.35)
    return [[*boxes[i],sc[i]] for i in np.array(idx).flatten()]
import sys
for n_,x in enumerate(r):
    print(n_,flush=True) if n_%10==0 else None
    im=ImageOps.exif_transpose(Image.open(x['path'])).convert('RGB'); W,H=im.size
    cy=int(max(0.45*H,(x['stamp_top']-MARGIN)*H)); x['crop_y']=cy
    s=min(1.0,1900/W); a=cv2.cvtColor(np.array(im.crop((0,0,W,cy))),cv2.COLOR_RGB2BGR)
    if s<1: a=cv2.resize(a,None,fx=s,fy=s)
    x['faces']=[[b[0]/s,b[1]/s,b[2]/s,b[3]/s,b[4]] for b in detect(a)]
json.dump(r,open('analysis2.json','w'))
import collections; fc=[len(x['faces']) for x in r]
print('faces/image  0:',fc.count(0),' 1-2:',sum(1 for c in fc if 1<=c<=2),' 3-6:',sum(1 for c in fc if 3<=c<=6),' 7+:',sum(1 for c in fc if c>=7))
