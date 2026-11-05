import json, os, collections, shutil, imagehash
import cv2, numpy as np
from PIL import Image, ImageOps, ImageFilter
r=json.load(open('analysis2.json')); cl=json.load(open('clusters.json'))
OUT='/home/claude/nexa-v3/gallery-candidates'; shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT)
# one representative per near-duplicate cluster (best sharpness*resolution, fewest faces)
def q(x): return x['sharp']/ (1+len(x['faces'])*0.6) * (x['W']*x['H'])**0.25
reps=[max((r[i] for i in c),key=q) for c in cl]
maxs=max(x['sharp'] for x in reps)
def score(x):
    big=sum(1 for f in x['faces'] if f[2]>0.035*x['W'])
    return 0.5*min(1,x['sharp']/ (0.5*maxs)) + 0.2*min(1,x['W']/3000) - 0.12*min(5,len(x['faces'])) - 0.2*min(3,big)
for x in reps: x['score']=score(x); x['day']=(x['folder'],x['dt'][:10])
EX=set(json.load(open('exclude.json'))['exclude'])
reps=[x for x in reps if len(x['faces'])<=3 and x['i'] not in EX and not (x['folder']=='B' and 'lab' not in x.get('tag','') and x['dt'][:10]!='2026:04:22')]
MANUAL=json.load(open('manual_blur.json')) if os.path.exists('manual_blur.json') else {}
H={x['i']:imagehash.hex_to_hash(x['dhash']) for x in reps}
chosen=[]; perday=collections.Counter()
pool=sorted(reps,key=lambda x:-x['score'])
while pool and len(chosen)<36:
    best=None;bv=-9
    for x in pool:
        if perday[x['day']]>=6: continue
        d=min((H[x['i']]-H[c['i']] for c in chosen),default=60)
        v=x['score']+0.02*min(d,40)
        if v>bv: bv=v;best=x
    if not best: break
    chosen.append(best); perday[best['day']]+=1; pool.remove(best)
if os.path.exists('fixed_selection.json'):
    byi={x['i']:x for x in r}; chosen=[byi[i] for i in json.load(open('fixed_selection.json'))]
else: chosen.sort(key=lambda x:(x['folder'],x['dt']))
print('selected',len(chosen),'| per folder',collections.Counter(c['folder'] for c in chosen),'| days',len(perday),'| total faces to blur',sum(len(c['faces']) for c in chosen))
man=[]
for n,x in enumerate(chosen,1):
    im=ImageOps.exif_transpose(Image.open(x['path'])).convert('RGB'); W,H_=im.size
    crop_y=x['crop_y']   # cut well above the stamp text, map thumbnail and GPS badge
    # blur detected faces (padded) before cropping, only those inside the kept area
    a=np.array(im)
    for (bx,by,bw,bh,c) in x['faces']+[[m[0]*W,m[1]*crop_y,m[2]*W,m[3]*crop_y,'m'] for m in MANUAL.get(str(x['i']),[])]:
        if by>crop_y: continue
        pad=0.15 if c=='m' else 0.5; x1=max(0,int(bx-bw*pad)); y1=max(0,int(by-bh*pad)); x2=min(W,int(bx+bw*(1+pad))); y2=min(crop_y,int(by+bh*(1+pad)))
        roi=a[y1:y2,x1:x2]; k=max(15,(int(max(bw,bh))//2)*2+1)
        mask=np.zeros(roi.shape[:2],np.uint8); cv2.ellipse(mask,((x2-x1)//2,(y2-y1)//2),((x2-x1)//2,(y2-y1)//2),0,0,360,255,-1)
        bl=cv2.GaussianBlur(roi,(k,k),0); roi[mask>0]=bl[mask>0]
    CR=json.load(open('crops.json')).get(str(x['i']),[0,0])
    im2=Image.fromarray(a).crop((int(W*CR[0]),0,int(W*(1-CR[1])),crop_y))
    sizes={}
    for w in (480,960,1600):
        if w>im2.size[0]: continue
        h=round(im2.size[1]*w/im2.size[0]); im2.resize((w,h),Image.LANCZOS).save(f'{OUT}/nia-{n:02d}-{w}.webp','WEBP',quality=80,method=6); sizes[w]=h
    man.append({'id':f'nia-{n:02d}','sizes':sizes,'faces_blurred':sum(1 for f in x['faces'] if f[1]<=crop_y)+len(MANUAL.get(str(x['i']),[])),'src_index':x['i'],'crop_frac':round(crop_y/H_,3)})
json.dump(man,open('/home/claude/photopipe/candidates.json','w'),indent=1)
print('kept height fraction min/median/max: %.2f %.2f %.2f'%(min(m['crop_frac'] for m in man),sorted(m['crop_frac'] for m in man)[len(man)//2],max(m['crop_frac'] for m in man)))
print('smallest output width:',min(max(m['sizes']) for m in man))
