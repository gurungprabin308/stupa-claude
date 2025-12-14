import React, { useEffect, useState } from 'react';
import { Popup } from '../types/popup';
import { api } from '../api/mockDataWithPopups';
import { useFirstVisit } from '../hooks/useFirstVisit';


function isScheduledAndActive(p: Popup){
const now = new Date();
const start = new Date(p.scheduledFor);
const end = p.expiresAt ? new Date(p.expiresAt) : null;
return p.published && start <= now && (!end || end > now);
}


export default function PopupBanner(){
const [popup, setPopup] = useState<Popup | null>(null);
const [visible, setVisible] = useState(false);
const isFirstVisit = useFirstVisit();


useEffect(() => {
if (!isFirstVisit) return; // only show on first entry


let mounted = true;
api.popups.getAll().then(list => {
if (!mounted) return;
// choose the latest scheduled published popup
const valid = list.filter(isScheduledAndActive).sort((a,b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
if (valid.length > 0) {
setPopup(valid[0]);
setVisible(true);
}
});


return () => { mounted = false; };
}, [isFirstVisit]);


if (!popup || !visible) return null;


return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
<div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-xl mx-4 shadow-2xl">
{popup.imageUrl && <img src={popup.imageUrl} alt={popup.title} className="w-full h-40 object-cover rounded-md mb-4" />}
<h3 className="text-xl font-bold mb-2">{popup.title}</h3>
<div className="mb-4 text-sm text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: popup.content }} />
<div className="flex gap-2 justify-end">
{popup.fileUrl && (<a className="text-sm underline" href={popup.fileUrl} target="_blank" rel="noreferrer">Download</a>)}
<button className="btn" onClick={() => setVisible(false)}>Close</button>
</div>
</div>
</div>
);
}