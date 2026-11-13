// Little Later OTA Live Feature & Bugfix Script (v1.3 Deep Black + UI + Two-Way Extension & Collab Sync)
(function(){
  try {
    /* 1. Inject #i-arrow-right into SVG sprite if missing */
    const svgRoot = document.querySelector('svg');
    if (svgRoot && !document.getElementById('i-arrow-right')) {
      svgRoot.insertAdjacentHTML('beforeend', '<symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>');
    }

    /* 2. Upgrade .quick-save and .nav-add-icon from raw Unicode to crisp SVG stroke icons */
    const qsIcon = document.querySelector('.quick-save-icon');
    if (qsIcon) qsIcon.innerHTML = '<svg class="icon"><use href="#i-plus"/></svg>';
    const qsArrow = document.querySelector('.quick-save-arrow');
    if (qsArrow) qsArrow.innerHTML = '<svg class="icon"><use href="#i-arrow-right"/></svg>';
    const navAddIcon = document.querySelector('.nav-add-icon');
    if (navAddIcon) navAddIcon.innerHTML = '<svg class="icon"><use href="#i-plus"/></svg>';

    /* 3. Inject .nav-blur-veil above/under bottom navigation bar if missing */
    if (!document.querySelector('.nav-blur-veil')) {
      const veil = document.createElement('div');
      veil.className = 'nav-blur-veil';
      veil.setAttribute('aria-hidden', 'true');
      document.body.appendChild(veil);
    }

    /* 4. Upgrade #addChoice to the morphing spring menu with SVG stroke icons */
    const addChoiceSheet = document.querySelector('#addChoice .add-choice-sheet');
    if (addChoiceSheet) {
      addChoiceSheet.innerHTML = `
        <button class="add-choice-item" data-action="chooseAddLink">
          <span class="add-choice-icon"><svg class="icon"><use href="#i-open"/></svg></span>
          <span class="add-choice-label">Link</span>
        </button>
        <button class="add-choice-item" data-action="chooseAddReminder">
          <span class="add-choice-icon"><svg class="icon"><use href="#i-today"/></svg></span>
          <span class="add-choice-label">Reminder</span>
        </button>
        <button class="add-choice-item" data-action="chooseAddTodo">
          <span class="add-choice-icon"><svg class="icon"><use href="#i-check"/></svg></span>
          <span class="add-choice-label">To-do list</span>
        </button>
        <button class="add-choice-item" data-action="newFolder">
          <span class="add-choice-icon"><svg class="icon"><use href="#i-folder"/></svg></span>
          <span class="add-choice-label">Folder</span>
        </button>`;
    }

    window.closeAddChoice = function(){
      document.getElementById('addChoice')?.classList.remove('visible');
      document.body.classList.remove('add-menu-open');
    };
    window.openAddChoice = function(){
      const m = document.getElementById('addChoice');
      if (!m) return;
      if (m.classList.contains('visible')) { closeAddChoice(); return; }
      m.classList.add('visible');
      document.body.classList.add('add-menu-open');
      if (typeof triggerHaptic === 'function') triggerHaptic(10);
    };

    document.getElementById('addChoice')?.addEventListener('click', (e) => {
      if (e.target.id === 'addChoice' || e.target.closest('[data-action="newFolder"]')) {
        closeAddChoice();
      }
    });

    document.getElementById('collabQuickInput')?.addEventListener('focus', () => {
      setTimeout(() => {
        document.getElementById('folderCollabComposer')?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      }, 180);
    });

    /* 5. Compact single-line date format so rectangular pills never wrap */
    window.friendlyDate = function(value, withTime=true){
      if(!value) return 'Unscheduled';
      const date = new Date(value);
      if(Number.isNaN(date.getTime())) return 'Unscheduled';
      const day = new Intl.DateTimeFormat(undefined, {day: 'numeric', month: 'short'}).format(date);
      return withTime ? `${day} · ${new Intl.DateTimeFormat(undefined, {hour: 'numeric', minute: '2-digit'}).format(date)}` : day;
    };

    /* 6. Track deleted/completed item IDs so two-way sync never resurrects deleted items */
    const STORE_DELETED = 'll_deleted_ids_v1';
    window.llDeletedIds = new Set(JSON.parse(localStorage.getItem(STORE_DELETED) || '[]'));
    function markItemDeleted(id){
      if(!id) return;
      window.llDeletedIds.add(String(id));
      localStorage.setItem(STORE_DELETED, JSON.stringify(Array.from(window.llDeletedIds).slice(-500)));
    }

    const origCompleteById = window.completeById;
    window.completeById = function(id){
      markItemDeleted(id);
      if(typeof origCompleteById === 'function') return origCompleteById(id);
    };

    const origCompleteTodoList = window.completeTodoList;
    window.completeTodoList = function(id){
      markItemDeleted(id);
      if(typeof origCompleteTodoList === 'function') return origCompleteTodoList(id);
    };

    const origRemoveCollabItem = window.removeCollabItem;
    window.removeCollabItem = function(id){
      markItemDeleted(id);
      if(typeof origRemoveCollabItem === 'function') return origRemoveCollabItem(id);
    };

    /* 7. Upgrade To-Do Card & Task Toggling with updatedAt timestamps so ticked tasks NEVER get unticked by background sync! */
    window.todoListCard = function(item){
      const dayLabel = item.reminder ? friendlyDate(item.reminder) : (item.dueAt ? friendlyDate(item.dueAt) : 'Unscheduled');
      const rows = (item.tasks || []).map(task => `<div class="todo-task-row ${task.done ? 'done' : ''}"><button class="todo-check" data-action="toggleTodoTask" data-id="${escapeHtml(item.id)}" data-task="${escapeHtml(task.id)}" aria-label="${task.done ? 'Mark incomplete' : 'Mark complete'}: ${escapeHtml(task.text)}" aria-pressed="${task.done}">${icon('check')}</button><span class="todo-task-text">${escapeHtml(task.text)}</span></div>`).join('');
      return `<article class="idea todo-list-card" data-item="${escapeHtml(item.id)}"><div class="todo-list-heading"><strong>To-do</strong></div>${todoProgress(item)}<div class="todo-task-list">${rows}</div><div class="todo-add-saved"><input class="input" type="text" maxlength="120" placeholder="Add a task" aria-label="Add task to list"><button data-action="addTodoTask" data-id="${escapeHtml(item.id)}" aria-label="Add task">${icon('plus')}</button></div><div class="card-pill-row"><span class="pill">${escapeHtml(dayLabel)}</span>${renderReminderOptPill(item)}</div><div class="idea-foot"><button class="text-action" data-action="openItem" data-id="${escapeHtml(item.id)}">Open</button>${(currentScreen === 'folderDetail' && folders.find(f => f.name === item.folder)?.collab) ? `<button class="text-action remove-action" data-action="removeCollabItem" data-id="${escapeHtml(item.id)}">Remove</button>` : `<button class="text-action done-action" data-action="completeTodoList" data-id="${escapeHtml(item.id)}">Done</button>`}</div></article>`;
    };

    window.addTodoTask = function(id, card){
      const input = card?.querySelector('.todo-add-saved input');
      const text = input?.value.trim();
      if(!text){ input?.focus(); return; }
      const item = items.find(x => x.id === id && x.kind === 'todoList');
      if(!item) return;
      const nowTs = Date.now();
      item.tasks = item.tasks || [];
      item.tasks.push({id: `${id}-${nowTs}`, text, done: false, updatedAt: nowTs});
      item.updatedAt = nowTs;
      persist();
      render();
      const updated = document.querySelector(`.todo-list-card[data-item="${CSS.escape(id)}"] .todo-task-row:last-child`);
      updated?.classList.add('task-added');
    };

    window.toggleTodoTask = function(id, taskId){
      const item = items.find(x => x.id === id && x.kind === 'todoList');
      const task = item?.tasks?.find(x => x.id === taskId);
      if(!task) return;
      const nowTs = Date.now();
      task.done = !task.done;
      task.updatedAt = nowTs;
      item.updatedAt = nowTs;
      triggerHaptic(10);
      persist();
      render();
      if(currentScreen === 'ideaDetail' && activeItem?.id === id) openItem(id);
      const updated = document.querySelector(`[data-task="${CSS.escape(taskId)}"]`)?.closest('.todo-task-row');
      updated?.classList.add('just-toggled');
    };

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

    /* 8. Two-Way Personal Backup Sync (/users/{email}) so saves & folders from Chrome Extension appear on the phone! */
    window.syncPersonalUserBackupWithFirebase = async function(allowPush=false){
      if(!currentUser || !currentUser.email) return false;
      const cleanEmail = currentUser.email.trim().toLowerCase();
      const docId = encodeURIComponent(cleanEmail);
      const userDocUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${docId}?key=${FIREBASE_API_KEY}`;
      const doFetch = typeof authFetchFirestore === 'function' ? authFetchFirestore : fetch;
      let changed = false;

      try{
        const getRes = await doFetch(userDocUrl, {cache: 'no-store'});
        if(getRes.ok){
          const existingDoc = await getRes.json();
          const storedBackup = existingDoc?.fields?.backupPayload?.stringValue || '';
          if(storedBackup){
            const parsed = JSON.parse(storedBackup);
            const remoteDeleted = Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [];
            remoteDeleted.forEach(id => window.llDeletedIds.add(String(id)));
            localStorage.setItem(STORE_DELETED, JSON.stringify(Array.from(window.llDeletedIds).slice(-500)));

            if(Array.isArray(parsed.folders)){
              parsed.folders.forEach(rf => {
                if(!rf || !rf.name) return;
                const idx = folders.findIndex(f => f.name.toLowerCase() === rf.name.toLowerCase());
                if(idx < 0){
                  folders.push(rf);
                  changed = true;
                }else if(rf.collab && !folders[idx].collab){
                  folders[idx] = {...folders[idx], ...rf};
                  changed = true;
                }
              });
            }

            const beforeLen = items.length;
            items = items.filter(x => !window.llDeletedIds.has(String(x.id)));
            if(items.length !== beforeLen) changed = true;

            if(Array.isArray(parsed.items)){
              parsed.items.forEach(ri => {
                if(!ri || !ri.id || window.llDeletedIds.has(String(ri.id))) return;
                if(ri.thumbnail === 'mascot.png') ri.thumbnail = '';
                const matchFolder = folders.find(f => f.name.toLowerCase() === String(ri.folder || '').toLowerCase());
                if(matchFolder) ri.folder = matchFolder.name;
                const idx = items.findIndex(x => String(x.id) === String(ri.id));
                if(idx >= 0){
                  const localIt = items[idx];
                  const localTime = localIt.updatedAt || localIt.savedAt || 0;
                  const remoteTime = ri.updatedAt || ri.savedAt || 0;
                  if(remoteTime > localTime && JSON.stringify(localIt) !== JSON.stringify(ri)){
                    items[idx] = ri;
                    changed = true;
                  }
                }else{
                  items.unshift(ri);
                  changed = true;
                  if(ri.url && !ri.thumbnail && typeof fetchFallbackPreview === 'function'){
                    fetchFallbackPreview(ri.url);
                  }
                }
              });
            }
          }
        }

        if(allowPush){
          const cleanFolders = folders.map(f => ({...f, image: ''}));
          const cleanItems = items
            .filter(x => !window.llDeletedIds.has(String(x.id)))
            .map(x => ({
              ...x,
              thumbnail: (x.thumbnail && (x.thumbnail.startsWith('data:') || x.thumbnail === 'mascot.png')) ? '' : (x.thumbnail || '')
            }));
          const backupPayload = JSON.stringify({
            folders: cleanFolders,
            items: cleanItems,
            deletedIds: Array.from(window.llDeletedIds).slice(-300),
            updatedAt: Date.now()
          });
          const fields = {
            name: {stringValue: String(currentUser.name || cleanEmail.split('@')[0])},
            email: {stringValue: cleanEmail},
            backupPayload: {stringValue: backupPayload},
            lastSeenAt: {integerValue: String(Date.now())}
          };
          const mask = 'updateMask.fieldPaths=name&updateMask.fieldPaths=email&updateMask.fieldPaths=backupPayload&updateMask.fieldPaths=lastSeenAt';
          await doFetch(`${userDocUrl}&${mask}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({fields})
          });
        }
      }catch(e){}
      return changed;
    };

    window.saveUserCloudBackup = async function(email, name){
      if(!email) return;
      await window.syncPersonalUserBackupWithFirebase(true);
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
          if(ri.thumbnail === 'mascot.png') ri.thumbnail = '';
          ri.folder = f.name;
          const idx = items.findIndex(x => x.id === ri.id);
          if(idx >= 0){
            const localIt = items[idx];
            if(localIt.kind === 'todoList' && ri.kind === 'todoList'){
              const taskMap = new Map();
              (Array.isArray(ri.tasks) ? ri.tasks : []).forEach(t => { if(t?.id) taskMap.set(t.id, {...t}); });
              (Array.isArray(localIt.tasks) ? localIt.tasks : []).forEach(lt => {
                if(!lt?.id) return;
                const rt = taskMap.get(lt.id);
                if(!rt || (lt.updatedAt || 0) >= (rt.updatedAt || 0)){
                  taskMap.set(lt.id, {...lt});
                }
              });
              const mergedTasks = Array.from(taskMap.values());
              const winner = ((localIt.updatedAt || localIt.savedAt || 0) >= (ri.updatedAt || ri.savedAt || 0)) ? {...localIt} : {...ri};
              winner.tasks = mergedTasks;
              winner.updatedAt = Math.max(localIt.updatedAt || 0, ri.updatedAt || 0);
              if(JSON.stringify(items[idx]) !== JSON.stringify(winner)){
                items[idx] = winner;
                changed = true;
              }
            } else {
              const localTime = localIt.updatedAt || localIt.savedAt || 0;
              const remoteTime = ri.updatedAt || ri.savedAt || 0;
              if(remoteTime > localTime && JSON.stringify(localIt) !== JSON.stringify(ri)){
                items[idx] = ri;
                changed = true;
              }
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
          thumbnail: x.thumbnail && (x.thumbnail.startsWith('data:') || x.thumbnail === 'mascot.png') ? '' : (x.thumbnail || '')
        }));
        const remoteCollabSig = JSON.stringify((remoteFolder?.collaborators || []).map(c => `${c.email}:${c.name}`));
        const localCollabSig = JSON.stringify((f.collaborators || []).map(c => `${c.email}:${c.name}`));
        const remoteItemSig = (remoteItems || []).map(x => `${x.id}:${x.updatedAt||x.savedAt||0}:${(x.tasks||[]).map(t=>`${t.id}:${t.done?1:0}`).join(',')}`).sort().join('|');
        const localItemSig = mergedItems.map(x => `${x.id}:${x.updatedAt||x.savedAt||0}:${(x.tasks||[]).map(t=>`${t.id}:${t.done?1:0}`).join(',')}`).sort().join('|');
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

    /* 9. Upgrade pullCollabStateFromFirebase so the phone pulls BOTH personal saves (/users/{email}) AND collab folders every 3 seconds! */
    window.pullCollabStateFromFirebase = async function(){
      if(typeof checkPendingGoogleSession === 'function') checkPendingGoogleSession();
      if(!currentUser || !currentUser.email) return;
      let changed = false;
      const personalChanged = await window.syncPersonalUserBackupWithFirebase(false);
      if(personalChanged) changed = true;
      const gotNewInvite = (typeof checkIncomingUserInvites === 'function') ? await checkIncomingUserInvites() : false;
      if(gotNewInvite) changed = true;
      const myCollabFolders = folders.filter(f => f.collab);
      for(const f of myCollabFolders){
        const c = await window.syncSingleCollabFolderWithFirebase(f, false);
        if(c) changed = true;
      }
      if(changed){
        persist(true);
        render();
      }
    };

    /* Trigger an immediate sync pass once OTA patch loads */
    setTimeout(window.pullCollabStateFromFirebase, 150);
  } catch (err) {}
})();
