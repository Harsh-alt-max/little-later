// Little Later OTA Live Feature & Bugfix Script
// Automatically upgrades collaboration sync & join handling on already-installed apps without reinstalling!
(function(){
  try {
    window.getCollabInviteUrl = function(folderName){
      const isAndroidAsset = !!window.Android || location.href.includes('android_asset');
      const base = isAndroidAsset ? 'https://harsh-alt-max.github.io/little-later/join.html' : location.href.split('?')[0].split('#')[0];
      const inviter = (currentUser?.name || '').trim();
      const inviterEmail = (currentUser?.email || '').trim().toLowerCase();
      const fObj = folders.find(f => f.name === folderName) || {name: folderName};
      const cid = getFolderCollabId(fObj);
      const ownerEmail = (fObj.ownerEmail || inviterEmail).toLowerCase();
      const ownerName = (fObj.ownerName || inviter).trim();
      return `${base}?join=${encodeURIComponent(folderName)}&cid=${encodeURIComponent(cid)}${ownerName ? `&by=${encodeURIComponent(ownerName)}` : ''}${ownerEmail ? `&owner=${encodeURIComponent(ownerEmail)}` : ''}`;
    };

    window.dedupeCollaborators = function(folder){
      if(!folder) return [];
      const ownerEmail = (folder.ownerEmail || '').toLowerCase();
      const ownerName = (folder.ownerName || '').toLowerCase();
      const byKey = new Map();
      (Array.isArray(folder.collaborators) ? folder.collaborators : []).forEach(c => {
        const cEmail = String(c?.email || '').trim().toLowerCase();
        const cName = String(c?.name || '').trim();
        const hasRealEmail = cEmail && cEmail.includes('@');
        const key = hasRealEmail ? cEmail : cName.toLowerCase();
        if(!key) return;
        if(ownerEmail && cEmail === ownerEmail) return;
        if(!hasRealEmail && ownerName && cName.toLowerCase() === ownerName) return;
        const prefix = hasRealEmail ? cEmail.split('@')[0].toLowerCase() : '';
        const existing = byKey.get(key);
        if(!existing){
          byKey.set(key, {name: cName || (hasRealEmail ? cEmail.split('@')[0] : 'Collaborator'), email: hasRealEmail ? cEmail : 'Collaborator', addedAt: c.addedAt || Date.now()});
        }else if(cName && cName.toLowerCase() !== prefix && existing.name.toLowerCase() === prefix){
          existing.name = cName;
        }
      });
      const clean = Array.from(byKey.values());
      folder.collaborators = clean;
      return clean;
    };

    window.tryHandleCollabJoinUrl = function(rawLink){
      try{
        const normalized = String(rawLink || '').startsWith('littlelater://')
          ? String(rawLink).replace(/^littlelater:\/\//i, 'https://littlelater.app/')
          : String(rawLink || '');
        const u = new URL(normalized);
        const gIdToken = u.searchParams.get('idToken');
        if(gIdToken && typeof verifyAndCompleteGoogleTokenLogin === 'function'){
          window.androidShareMode = false;
          verifyAndCompleteGoogleTokenLogin(gIdToken, u.searchParams.get('refreshToken') || '', u.searchParams.get('googleName') || '');
          return true;
        }
        const joinName = u.searchParams.get('join') || u.searchParams.get('folder');
        const joinCid = u.searchParams.get('cid') || '';
        const joinBy = u.searchParams.get('by') || u.searchParams.get('from') || '';
        const joinOwner = (u.searchParams.get('owner') || '').trim().toLowerCase();
        if(!joinName) return false;
        window.androidShareMode = false;
        if(!currentUser || !currentUser.email){
          localStorage.setItem('ll_pending_join_folder', joinName);
          if(joinCid) localStorage.setItem('ll_pending_join_cid', joinCid);
          if(joinBy) localStorage.setItem('ll_pending_join_by', joinBy);
          if(joinOwner) localStorage.setItem('ll_pending_join_owner', joinOwner);
          show('welcome', false);
          openAuthModal('signup');
          toast(`Sign in to join "${joinName}" Collab`);
          return true;
        }
        const myEmail = currentUser.email.trim().toLowerCase();
        const mySlug = myEmail.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        let targetF = folders.find(f => (joinCid && f.collabId === joinCid) || f.name.toLowerCase() === joinName.toLowerCase());
        if(!targetF){
          targetF = {name: joinName, kind: 'folder', icon: 'folder', collab: true, collabId: joinCid, ownerEmail: joinOwner, ownerName: joinBy, collaborators: []};
          folders.push(targetF);
        }
        targetF.collab = true;
        if(joinCid) targetF.collabId = joinCid;
        if(joinOwner) targetF.ownerEmail = joinOwner;
        if(joinBy && (!targetF.ownerName || targetF.ownerEmail !== myEmail)) targetF.ownerName = joinBy;
        const cid = getFolderCollabId(targetF);
        const isForeign = cid.startsWith('cf_') && mySlug && !cid.startsWith('cf_' + mySlug + '_');
        if(isForeign && targetF.ownerEmail && targetF.ownerEmail.toLowerCase() === myEmail){
          targetF.ownerEmail = joinOwner || '';
          targetF.ownerName = joinBy || '';
        }
        targetF.collaborators = Array.isArray(targetF.collaborators) ? targetF.collaborators : [];
        if(isForeign || (targetF.ownerEmail && targetF.ownerEmail.toLowerCase() !== myEmail)){
          targetF.collaborators.push({name: currentUser.name || myEmail.split('@')[0], email: myEmail, addedAt: Date.now()});
          dedupeCollaborators(targetF);
        }
        activeFolder = targetF.name;
        persist(true);
        show('folderDetail', false);
        toast(`Syncing "${targetF.name}"…`);
        syncSingleCollabFolderWithFirebase(targetF, true).then(() => {
          persist(true);
          render();
          toast(`Joined "${targetF.name}"!`);
        });
        return true;
      }catch(e){ return false; }
    };

    window.syncSingleCollabFolderWithFirebase = async function(f, allowPush=true){
      if(!currentUser || !currentUser.email || !f || !f.collab) return false;
      const fid = getFolderCollabId(f);
      const myEmail = currentUser.email.trim().toLowerCase();
      const mySlug = myEmail.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const isCollaboratorByCid = fid.startsWith('cf_') && mySlug && !fid.startsWith('cf_' + mySlug + '_');
      if(isCollaboratorByCid && f.ownerEmail && f.ownerEmail.toLowerCase() === myEmail){
        f.ownerEmail = '';
        f.ownerName = '';
      }

      const docUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/collab_folders/${encodeURIComponent(fid)}?key=${FIREBASE_API_KEY}`;
      const doFetch = typeof authFetchFirestore === 'function' ? authFetchFirestore : fetch;
      let changed = false;

      try{
        const r = await doFetch(docUrl, {cache: 'no-store'});
        let remoteFolder = null;
        let remoteItems = [];
        let remoteDeletedIds = [];
        if(r.ok){
          const doc = await r.json();
          const rawPayload = doc?.fields?.payload?.stringValue || '';
          if(rawPayload){
            const parsed = JSON.parse(rawPayload);
            remoteFolder = parsed.folder || null;
            remoteItems = Array.isArray(parsed.items) ? parsed.items : [];
            remoteDeletedIds = Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [];
          }
        }

        f.deletedIds = Array.from(new Set([...(Array.isArray(f.deletedIds) ? f.deletedIds : []), ...remoteDeletedIds]));
        const deletedSet = new Set(f.deletedIds);

        if(remoteFolder?.ownerEmail && (!f.ownerEmail || isCollaboratorByCid)){
          if(f.ownerEmail !== remoteFolder.ownerEmail || f.ownerName !== remoteFolder.ownerName) changed = true;
          f.ownerEmail = remoteFolder.ownerEmail;
          f.ownerName = remoteFolder.ownerName || remoteFolder.ownerEmail.split('@')[0];
        }else if(!f.ownerEmail && !isCollaboratorByCid && myEmail){
          f.ownerEmail = myEmail;
          f.ownerName = currentUser.name || myEmail.split('@')[0];
        }

        const combinedCollabs = [
          ...(Array.isArray(remoteFolder?.collaborators) ? remoteFolder.collaborators : []),
          ...(Array.isArray(f.collaborators) ? f.collaborators : [])
        ];
        if(isCollaboratorByCid || (f.ownerEmail && myEmail !== f.ownerEmail.toLowerCase())){
          combinedCollabs.push({
            name: currentUser.name || myEmail.split('@')[0],
            email: myEmail,
            addedAt: Date.now()
          });
        }
        const prevCollabJson = JSON.stringify(f.collaborators || []);
        f.collaborators = combinedCollabs;
        dedupeCollaborators(f);
        if(JSON.stringify(f.collaborators) !== prevCollabJson) changed = true;

        const beforeCount = items.filter(x => x.folder.toLowerCase() === f.name.toLowerCase()).length;
        items = items.filter(x => !(x.folder.toLowerCase() === f.name.toLowerCase() && deletedSet.has(x.id)));

        remoteItems.forEach(ri => {
          if(!ri || !ri.id || deletedSet.has(ri.id)) return;
          ri.folder = f.name;
          const idx = items.findIndex(x => x.id === ri.id);
          if(idx >= 0){
            if(JSON.stringify(items[idx]) !== JSON.stringify(ri)){
              items[idx] = ri;
              changed = true;
            }
          }else{
            items.push(ri);
            changed = true;
          }
        });

        const afterCount = items.filter(x => x.folder.toLowerCase() === f.name.toLowerCase()).length;
        if(afterCount !== beforeCount) changed = true;

        const mergedItems = items.filter(x => x.folder.toLowerCase() === f.name.toLowerCase() && !deletedSet.has(x.id)).map(x => ({
          ...x,
          folder: f.name,
          thumbnail: x.thumbnail && x.thumbnail.startsWith('data:') ? '' : (x.thumbnail || '')
        }));
        const remoteCollabSig = JSON.stringify((remoteFolder?.collaborators || []).map(c => `${c.email}:${c.name}`));
        const localCollabSig = JSON.stringify((f.collaborators || []).map(c => `${c.email}:${c.name}`));
        const remoteItemSig = (remoteItems || []).map(x => `${x.id}:${x.savedAt||0}:${(x.tasks||[]).map(t=>t.done?1:0).join('')}`).sort().join('|');
        const localItemSig = mergedItems.map(x => `${x.id}:${x.savedAt||0}:${(x.tasks||[]).map(t=>t.done?1:0).join('')}`).sort().join('|');
        const remoteOwnerMissing = !remoteFolder?.ownerEmail && !!f.ownerEmail;
        const shouldPush = allowPush || !remoteFolder || remoteCollabSig !== localCollabSig || remoteItemSig !== localItemSig || remoteOwnerMissing;

        if(shouldPush){
          const fPayload = JSON.stringify({
            folder: {
              name: f.name,
              kind: 'folder',
              icon: f.icon || 'folder',
              collab: true,
              collabId: fid,
              ownerEmail: f.ownerEmail || (isCollaboratorByCid ? '' : myEmail),
              ownerName: f.ownerName || (isCollaboratorByCid ? '' : currentUser.name),
              collaborators: f.collaborators
            },
            items: mergedItems,
            deletedIds: f.deletedIds,
            updatedAt: Date.now()
          });
          await doFetch(`${docUrl}&updateMask.fieldPaths=payload&updateMask.fieldPaths=version`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              fields: {
                version: {integerValue: String(Date.now())},
                payload: {stringValue: fPayload}
              }
            })
          });
        }
      }catch(e){}
      return changed;
    };

    /* Trigger an immediate sync pass once OTA patch loads */
    if(typeof pullCollabStateFromFirebase === 'function'){
      setTimeout(pullCollabStateFromFirebase, 200);
    }
  } catch (err) {}
})();
