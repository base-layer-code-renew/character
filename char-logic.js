        class Character {
            constructor(id, x, y, type, isCPU, controls, pName) {
                this.id = id; this.name = pName || (id + "P"); this.type = (type === 'random') ? getRandomCharObj() : type; this.isCPU = isCPU; this.color = colors[this.type]; this.controls = controls;
                Object.keys(colors).forEach(k => { this['is' + k.charAt(0).toUpperCase() + k.slice(1)] = (this.type === k); });

                this.w = (this.isNinja || this.isPink || this.isDrone || this.isOrbit || this.isSpark || this.isSlime || this.isCursor || this.isEvo_slim) ? 26 : (this.isTitan || this.isQuake || this.isBurst || this.isSizer || this.isTurtle) ? 42 : 34;
                this.h = (this.isNinja || this.isPink || this.isDrone || this.isOrbit || this.isSpark || this.isSlime || this.isCursor || this.isEvo_slim) ? 38 : (this.isTitan || this.isQuake || this.isBurst || this.isSizer || this.isTurtle) ? 58 : 48;
                this.weight = (this.isNinja || this.isPink) ? 1.4 : (this.isTitan || this.isQuake) ? 0.55 : (this.isTurtle) ? 0 : 1.0;
                
                // Dancerは能力3倍
                this.moveSpeed = (this.isNinja || this.isPink) ? 1.1 : (this.isTitan || this.isQuake) ? 0.5 : (this.isTurtle) ? 0.2 : (this.isTimeslip) ? 1.6 : (this.isDancer) ? 2.4 : 0.8;
                this.jumpPower = (this.isNinja || this.isPink) ? -17 : (this.isTitan || this.isQuake) ? -13 : (this.isTurtle) ? -5 : (this.isDancer) ? -35 : -15;
                this.gravity = (this.isNinja || this.isPink) ? 0.6 : (this.isTitan || this.isQuake) ? 0.5 : (this.isDancer) ? 2.1 : 0.7;

                this.baseMoveSpeed = this.moveSpeed; this.baseJumpPower = this.jumpPower; this.baseGravity = this.gravity; this.baseW = this.w; this.baseH = this.h;
                this.x = x; this.y = y; this.dx = 0; this.dy = 0;
                const mVal = isOnlineMode ? parseInt(document.getElementById('online-mode-val').value) : parseInt(document.getElementById('mode-val').value);
                this.dmg = 0; this.stocks = mVal; this.hp = mVal;
                
                this.score = 0; this.dir = (id === 1) ? 1 : -1; this.grounded = false; this.cd = 0; this.charge = 0;
                this.isAtk = false; this.respawnTimer = 0; this.dashTimer = 0; this.ninjaAtkCount = 0; this.jumpCount = 0;
                this.shieldTimer = 0; this.shieldActive = 0; this.grabbedTarget = null; this.grabTimer = 0; this.isGrabbed = false; this.justGrabbed = 0;
                this.escapeMashingCount = 0; this.prevAttackKey = false; this.thunderCharge = 0; this.hasBoomerang = true;
                this.stunTimer = 0; this.speedTimer = 0; this.jumpTimer = 0; this.gravityTimer = 0; this.burnTimer = 0;
                this.mirrorTimer = 0; this.meteorActive = false; this.drillTimer = 0; this.batteryCharge = 0; this.buriedTimer = 0; this.quakeCharge = 0;
                this.invTimer = 60; this.uiThiefTimer = 0; this.flipTimer = 0; this.magnetTimer = 0; this.magnetDir = 1; this.bombTimer = 0; this.zombieTimer = 0;
                this.history = []; this.inputQueue = []; this.isZombieActive = false; this.vampireCurseTimer = 0;
                this.timeStopCd = 600; this.timeStopTimer = 0;
                
                // Dancer Barrier
                this.hasDancerBarrier = this.isDancer ? true : false;
                this.dancerBarrierTimer = 300;
            }

            update() {
                if (this.respawnTimer > 0) { if (--this.respawnTimer === 1) this.spawn(); return; }
                if (!gameActive && !isCountingDown) return;

                if (this.isDancer && !this.hasDancerBarrier) {
                    this.dancerBarrierTimer--;
                    if (this.dancerBarrierTimer <= 0) {
                        this.hasDancerBarrier = true;
                        this.dancerBarrierTimer = 300;
                        for(let i=0; i<10; i++) particles.push({ x: this.x+this.w/2, y: this.y+this.h/2, dx: (Math.random()-0.5)*10, dy: (Math.random()-0.5)*10, life: 20, c: "#f472b6" });
                    }
                }

                if (this.isTimeslip && gameActive && !isCountingDown) {
                    if (this.timeStopCd > 0) { this.timeStopCd--; } 
                    else {
                        this.timeStopCd = 600; const t = players.find(p => p.id !== this.id);
                        if (t) { t.timeStopTimer = 180; for(let i=0; i<30; i++) particles.push({ x: t.x+t.w/2, y: t.y+t.h/2, dx: (Math.random()-0.5)*30, dy: (Math.random()-0.5)*30, life: 60, c: "#0f766e" }); }
                        globalTimeStopTimer = 180; globalTimeStopperId = this.id;
                    }
                }

                if (this.timeStopTimer > 0) {
                    this.timeStopTimer--;
                    if (frameCount % 5 === 0) particles.push({ x: this.x + Math.random()*this.w, y: this.y + Math.random()*this.h, dx: 0, dy: 0, life: 10, c: "#0f766e" });
                    this.dx = 0; this.dy = 0;
                    return;
                }

                if (this.isTimeslip) { this.history.push({x: this.x, y: this.y, hp: this.hp, dmg: this.dmg}); if (this.history.length > 300) this.history.shift(); }
                if (this.isLagger) { this.inputQueue.push({...keys}); if (this.inputQueue.length > 6) this.inputQueue.shift(); }

                if (this.invTimer > 0) this.invTimer--;
                if (this.uiThiefTimer > 0) this.uiThiefTimer--;
                if (this.flipTimer > 0) this.flipTimer--;
                if (this.zombieTimer > 0) { this.zombieTimer--; if (this.zombieTimer === 0) this.die(true); }

                if (this.vampireCurseTimer > 0) {
                    this.vampireCurseTimer--;
                    if (this.vampireCurseTimer % 30 === 0) {
                        if (config.mode === 'hp') { this.hp--; if(this.hp<=0) this.die(); } else this.dmg++;
                        particles.push({ x: this.x + Math.random()*this.w, y: this.y + Math.random()*this.h, dx: 0, dy: -2, life: 20, c: "#991b1b" });
                    }
                }

                if (this.isVampire && frameCount % 30 === 0) { if (config.mode === 'hp') { this.hp -= 1; if(this.hp<=0) this.die(); } else this.dmg += 1; }

                if (this.bombTimer > 0) {
                    this.bombTimer--;
                    if (this.bombTimer === 0) {
                        burstEffects.push({ x: this.x+this.w/2, y: this.y+this.h/2, timer: 40, color: "#f00" });
                        const t = players.find(p=>p.id!==this.id); if (Math.hypot(t.x-this.x, t.y-this.y) < 150) this.hit(t, 50, 2.0);
                        if (config.mode === 'hp') { this.hp -= 50; if(this.hp<=0) this.die(); } else this.dmg += 50;
                    }
                }

                if (this.buriedTimer > 0) { this.buriedTimer--; this.dx = 0; this.dy = 0; } 
                else if (this.stunTimer > 0) { this.stunTimer--; } 
                else {
                    if (this.speedTimer > 0) { this.speedTimer--; this.moveSpeed = this.baseMoveSpeed * 0.5; } else this.moveSpeed = this.baseMoveSpeed;
                    if (this.jumpTimer > 0) { this.jumpTimer--; this.jumpPower = this.baseJumpPower * 0.5; } else this.jumpPower = this.baseJumpPower;
                    if (this.gravityTimer > 0) { this.gravityTimer--; this.gravity = this.baseGravity * 2.5; } else this.gravity = this.baseGravity;
                    if (this.burnTimer > 0) { this.burnTimer--; if (this.burnTimer % 30 === 0) { if (config.mode === 'hp') { this.hp--; if(this.hp<=0) this.die(); } else this.dmg++; this.dx += (Math.random() < 0.5 ? -1 : 1) * 3; this.dy -= 2; } }
                    if (this.magnetTimer > 0) { this.magnetTimer--; const t = players.find(p=>p.id!==this.id); if(t) { this.dx += (t.x > this.x ? this.magnetDir : -this.magnetDir) * 0.5; } }
                    if (this.mirrorTimer > 0) this.mirrorTimer--;
                    if (this.isBattery && !this.isAtk && this.cd === 0 && this.batteryCharge < 150) { if (frameCount % 3 === 0) this.batteryCharge++; }

                    if (this.isGrabbed) {
                        let reqMashes = 10; const grabber = players.find(p => p.grabbedTarget === this);
                        if (grabber) { let tv = config.mode === 'hp' ? (this.hp + grabber.hp) : (this.dmg + grabber.dmg); if (tv < 50) reqMashes = 10; else if (tv < 100) reqMashes = 7; else if (tv < 150) reqMashes = 5; else if (tv < 200) reqMashes = 3; else reqMashes = 2; }
                        const atkKey = keys[this.controls.attack] || keys['Digit1'] || keys['Numpad1'];
                        if (!this.isCPU) { if (atkKey && !this.prevAttackKey) { this.escapeMashingCount++; particles.push({ x: this.x+this.w/2, y: this.y+this.h/2, dx: (Math.random()-0.5)*10, dy: (Math.random()-0.5)*10, life: 10, c: "#fff" }); if (this.escapeMashingCount >= reqMashes) this.escapeGrab(); } this.prevAttackKey = atkKey; } 
                        else { if (Math.random() < 0.15) { this.escapeMashingCount++; particles.push({ x: this.x+this.w/2, y: this.y+this.h/2, dx: (Math.random()-0.5)*10, dy: (Math.random()-0.5)*10, life: 10, c: "#fff" }); if (this.escapeMashingCount >= reqMashes) this.escapeGrab(); } }
                        if (this.x < -150 || this.x > canvas.width + 150 || this.y < -200 || this.y > canvas.height + 150) this.die(); return;
                    } else { if (!this.isCPU) this.prevAttackKey = keys[this.controls.attack] || keys['Digit1'] || keys['Numpad1']; }

                    if (this.grabbedTarget) { this.grabbedTarget.x = this.x + (this.dir === 1 ? this.w : -this.grabbedTarget.w); this.grabbedTarget.y = this.y; this.grabbedTarget.dx = 0; this.grabbedTarget.dy = 0; this.grabbedTarget.dir = -this.dir; this.grabTimer--; if (this.justGrabbed > 0) this.justGrabbed--; if (this.grabTimer <= 0) this.executeThrow(); }
                    if (this.isTimebomb && this.bombTimer === 0) this.bombTimer = 600;
                    if (this.isTimebomb) { const t=players.find(p=>p.id!==this.id); if(t && Math.hypot(t.x-this.x, t.y-this.y)<40 && t.invTimer===0) { t.bombTimer = this.bombTimer; this.bombTimer = 0; } }

                    if (!isCountingDown) { if (this.isCPU) this.aiLogic(); else if (isOnlineMode) { if ((isHost && this.id === 1) || (!isHost && this.id === 2)) this.handleInput(); } else this.handleInput(); }
                }

                if (this.buriedTimer === 0) { this.dy += this.gravity * globalGravityModifier; this.dx *= 0.85; this.x += this.dx; this.y += this.dy; this.grounded = false; }
                
                [...platforms, ...bombs, ...painterBlocks].forEach(p => {
                    const isFalling = keys[this.controls.down]; const canPass = p.h < 10 || p.owner !== undefined; 
                    if (this.dy >= 0 && this.y + this.h <= p.y + 12 && this.y + this.h + this.dy >= p.y && this.x + this.w > p.x && this.x < p.x + p.w) {
                        if (!canPass || !isFalling) { this.y = p.y - this.h; this.dy = 0; this.grounded = true; this.ninjaAtkCount = 0; this.jumpCount = 0; }
                    }
                });

                if (this.isIceRun && this.grounded && Math.abs(this.dx)>1 && frameCount%5===0) iceAreas.push({x: this.x, y: this.y+this.h-5, w: this.w, h: 5, life: 180});
                let onIce = false; iceAreas.forEach(a => { if (this.x < a.x+a.w && this.x+this.w > a.x && this.y+this.h >= a.y && this.y+this.h <= a.y+a.h) onIce = true; });
                if (onIce) this.dx *= 1.1;

                if (this.meteorActive) { this.isAtk = true; const t = players.find(p => p.id !== this.id); if (t && this.x < t.x + t.w && this.x + this.w > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { this.hit(t, 20, 2.0, 0, 1.5); this.meteorActive = false; this.dy = -10; if (t.grounded && t.invTimer === 0) { t.buriedTimer = 42; t.y = t.y + 10; } } if (this.grounded) { this.meteorActive = false; for(let i=0;i<10;i++) particles.push({ x: this.x+this.w/2, y: this.y+this.h, dx: (Math.random()-0.5)*15, dy: -Math.random()*10, life: 20, c: "#991b1b" }); } }
                if (this.drillTimer > 0) { this.drillTimer--; this.isAtk = true; if (this.drillTimer % 5 === 0) { const t = players.find(p => p.id !== this.id); if (t) { const reach=120; const hX=(this.dir===1)?this.x+this.w:this.x-reach; if(hX < t.x+t.w && hX+reach > t.x && this.y - 40 < t.y+t.h && this.y+this.h + 40 > t.y) this.hit(t, 3, 0.2); } } }
                if (this.shieldTimer > 0) { this.shieldTimer--; if (this.shieldTimer === 0) this.shieldActive = 18; }
                if (this.shieldActive > 0) this.shieldActive--;

                if (this.type === 'laser' && this.charge > 0 && !isCountingDown) { if (++this.charge >= 100) { this.fireLaser(); this.charge = 0; this.cd = 60; } }
                if (this.thunderCharge > 0 && !isCountingDown) { this.thunderCharge--; this.isAtk = true; if (this.thunderCharge % 5 === 0) particles.push({ x: this.x + Math.random() * this.w, y: this.y + Math.random() * this.h, dx: (Math.random()-0.5)*5, dy: (Math.random()-0.5)*5, life: 15, c: "#fef08a" }); if (this.thunderCharge === 0) { this.fireThunder(); setTimeout(() => this.isAtk = false, 150); } }
                if (this.quakeCharge > 0 && !isCountingDown) { this.quakeCharge--; this.isAtk = true; if (this.quakeCharge === 0) { this.fireQuake(); setTimeout(() => this.isAtk = false, 150); } }

                if (this.dashTimer > 0) this.dashTimer--;
                if (this.cd > 0) this.cd--;
                if (this.x < -150 || this.x > canvas.width + 150 || this.y < -200 || this.y > canvas.height + 150) this.die();
            }

            handleInput() {
                let k = keys; if (this.isLagger && this.inputQueue.length > 0) k = this.inputQueue[0];
                let l = k[this.controls.left], r = k[this.controls.right]; if (this.flipTimer > 0) { l = k[this.controls.right]; r = k[this.controls.left]; }

                if (l) { this.dx -= this.moveSpeed; this.dir = -1; }
                if (r) { this.dx += this.moveSpeed; this.dir = 1; }
                
                if (k[this.controls.up] && !this.isPink) {
                    if (this.grounded) { this.dy = this.jumpPower; this.jumpCount = 1; keys[this.controls.up] = false; } 
                    else if ((this.isStriker || this.isGunner || this.isVampire || this.isTimeslip) && this.jumpCount < 3) { this.dy = this.jumpPower * 0.8; this.jumpCount++; keys[this.controls.up] = false; for(let i=0;i<8;i++) particles.push({ x: this.x+this.w/2, y: this.y+this.h, dx: (Math.random()-0.5)*8, dy: Math.random()*5, life: 15, c: "#fff" }); }
                    else if ((this.isOrbit || this.isJump) && this.jumpCount < (this.isJump?5:2)) { this.dy = this.jumpPower * 0.8; this.jumpCount++; keys[this.controls.up] = false; for(let i=0;i<8;i++) particles.push({ x: this.x+this.w/2, y: this.y+this.h, dx: (Math.random()-0.5)*8, dy: Math.random()*5, life: 15, c: "#fff" }); }
                } else if (k[this.controls.up] && this.isPink) {
                    const atkK = k[this.controls.attack] || k['Digit1'] || k['Numpad1'];
                    if (!atkK && this.grounded) { this.dy = this.jumpPower; this.jumpCount = 1; keys[this.controls.up] = false; }
                }
                if (this.isStriker && k[this.controls.down] && this.shieldTimer === 0 && this.shieldActive === 0 && this.cd === 0) this.shieldTimer = 30; 
                const atkK = k[this.controls.attack] || k['Digit1'] || k['Numpad1'];
                if (atkK) {
                    if (this.grabbedTarget && this.justGrabbed === 0) { this.executeThrow(); keys[this.controls.attack] = false; keys['Digit1'] = false; keys['Numpad1'] = false; } 
                    else if (this.cd === 0 && !this.grabbedTarget) this.performAttack(null, k);
                }
            }

            aiLogic() {
                const t = players.find(p => p.id !== this.id); if (!t || !gameActive) return;
                const isOff = this.x < 100 || this.x > 700 || this.y > 400; const tIsOff = t.x < 100 || t.x > 700 || t.y > 400;
                if (isOff && !this.grounded) { this.dx += (this.x < 400 ? 1.5 : -1.5); if (this.dy > 0) { if (this.jumpCount < 3 && (this.isStriker || this.isGunner || this.isVampire || this.isTimeslip)) { this.dy = this.jumpPower * 0.8; this.jumpCount++; } else if (this.isOrbit && this.jumpCount < 2) { this.dy = this.jumpPower * 0.8; this.jumpCount++; } else if (this.isNinja && this.ninjaAtkCount < 2 && this.cd === 0) this.performAttack(); else if (!this.isNinja && Math.random() < 0.2) this.dy = this.jumpPower * 0.7; } return; }
                if (this.grabbedTarget) { if (this.justGrabbed > 0) this.justGrabbed--; if (this.justGrabbed === 0 && Math.random() < 0.05) this.executeThrow(); this.dx += (this.dir * this.moveSpeed); if (Math.random() < 0.02) this.dir *= -1; if (this.grounded && Math.random() < 0.02) this.dy = this.jumpPower; return; }
                let dgr = false; let cObj = null; let mD = 1000; const chkD = (ox, oy, dr) => { const d = Math.hypot(ox - (this.x+this.w/2), oy - (this.y+this.h/2)); if (d < dr && d < mD) { dgr = true; mD = d; cObj = {x:ox, y:oy}; } };
                bullets.forEach(b => { if(b.owner!==this.id) chkD(b.x, b.y, 80); }); bombs.forEach(b => chkD(b.x+b.w/2, b.y+b.h/2, 100)); boomerangs.forEach(b => { if(b.owner!==this.id) chkD(b.x, b.y, 80); }); thunders.forEach(td => { if(td.owner!==this.id) chkD(td.x+td.w/2, td.y+td.h/2, 60); });
                const dist = Math.abs(t.x - this.x); const yDist = t.y - this.y; if (t.isAtk && dist < 120 && Math.abs(yDist) < 50) chkD(t.x+t.w/2, t.y+t.h/2, 120);
                if (dgr) { if (this.isStriker && this.shieldTimer === 0 && this.shieldActive === 0 && dist < 80) { this.shieldTimer = 30; } else { if (this.grounded && Math.random() < 0.6) { this.dy = this.jumpPower; this.jumpCount = 1; } else { this.dx += (this.x > cObj.x ? 1.5 : -1.5); } } return; }
                const rAtk = { striker: 65, gunner: 400, laser: 500, bomber: 150, titan: 120, ninja: 60, grappler: 65, thunder: 80, boomerang: 200, pink: 45, wind: 30, ice: 400, magma: 65, blade: 85, slime: 300, meteor: 80, battery: 65, drill: 60, pulse: 90, orbit: 100, gravity: 65, quake: 200, phantom: 100, acid: 80, mirror: 100, spark: 400, drone: 300, glitch: 100, void: 65, burst: 40, remote: 150, command: 80, shadow: 400, lagger: 60, uithief: 60, director: 60, flipper: 60, grav_master: 60, painter: 400, magnet: 60, ice_run: 200, portal: 400, gambler: 60, reflector: 100, timebomb: 40, sizer: 60, vampire: 50, cursor: 300, ghost_p: 100, illusion: 80, dancer: 60, evo_slime: 60, copycat: 50, paper: 300, turtle: 80, zombie: 200, squid: 60, present: 100, silencer: 60, error: 400, timeslip: 300 }; 
                const idealDist = rAtk[this.type] || 60;
                if (tIsOff && !isOff && this.grounded) { const edgeX = t.x < 400 ? 150 : 650; if (Math.abs(this.x - edgeX) > 30) { this.dx += (this.x < edgeX ? this.moveSpeed * 1.2 : -this.moveSpeed * 1.2); this.dir = this.x < edgeX ? 1 : -1; } else { this.dir = t.x < 400 ? -1 : 1; this.dx *= 0.5; if (dist < idealDist && this.cd === 0) this.performAttack(); } } 
                else { if (!t.grounded && t.y < this.y - 40 && dist < 100 && this.grounded && Math.random() < 0.8) { this.dy = this.jumpPower; this.jumpCount = 1; } if (dist > idealDist + 20) { this.dx += (t.x > this.x ? this.moveSpeed * 1.3 : -this.moveSpeed * 1.3); this.dir = t.x > this.x ? 1 : -1; if (this.grounded && Math.random() < 0.05) { this.dy = this.jumpPower * 0.6; this.jumpCount = 1; } } else if (dist < idealDist - 20 && !this.isGrappler && !this.isPink && !this.isWind) { this.dx += (t.x > this.x ? -this.moveSpeed : this.moveSpeed); this.dir = t.x > this.x ? 1 : -1; } else { this.dir = t.x > this.x ? 1 : -1; if (Math.random() < 0.1) this.dx += (Math.random() < 0.5 ? this.moveSpeed : -this.moveSpeed); } }
                if (this.isMeteor && t.y > this.y && dist < 40 && !this.grounded && this.cd === 0) this.performAttack();
                if (this.cd === 0) {
                    if (this.isThunder) { if (dist < 60 && t.y < this.y + 50) this.performAttack(); } 
                    else if (this.isPink || this.isCommand || this.isTimeslip) { if (dist < (this.isTimeslip ? 300 : 45)) { if (t.y < this.y - 20) keys[this.controls.up] = true; else if (t.y > this.y + 20 && !this.isTimeslip) keys[this.controls.down] = true; this.performAttack(null, keys); keys[this.controls.up] = false; keys[this.controls.down] = false; } } 
                    else if (this.isQuake) { if (t.grounded) this.performAttack(); } 
                    else if (this.isDrill || this.isBlade) { if (dist < idealDist * 1.2 && Math.random() < 0.7) this.performAttack(); } 
                    else if (this.isRemote) { const mb = bombs.find(b => b.owner === this.id && b.remote && !b.exploded); if (mb) { if (Math.hypot(t.x+t.w/2 - (mb.x+mb.w/2), t.y+t.h/2 - (mb.y+mb.h/2)) < 70) this.performAttack(); } else if (dist < idealDist && dist > 50 && Math.random() < 0.8) { this.performAttack(); } } 
                    else if (dist < idealDist) { if (t.shieldActive > 0 && !this.isGrappler) { if (Math.random() < 0.2) this.performAttack(); } else { if (Math.random() < 0.8) this.performAttack(); } }
                }
            }

            performAttack(oType = null, k = keys) {
                this.isAtk = true; const t = players.find(p => p.id !== this.id); const aType = oType || this.type;
                if (aType === 'glitch') { this.cd = 30; const s = ['striker', 'gunner', 'laser', 'bomber', 'ninja', 'grappler', 'thunder', 'boomerang', 'pink', 'wind', 'ice', 'magma', 'blade', 'slime', 'meteor', 'drill', 'pulse', 'orbit', 'gravity', 'quake', 'phantom', 'acid', 'spark', 'drone', 'void', 'timeslip', 'lagger', 'uithief', 'director', 'flipper', 'grav_master', 'painter', 'magnet', 'ice_run', 'portal', 'gambler', 'reflector', 'timebomb', 'sizer', 'vampire', 'cursor', 'ghost_p', 'command', 'illusion', 'dancer', 'evo_slime', 'copycat', 'paper', 'turtle', 'zombie', 'squid', 'present', 'silencer', 'shadow', 'error']; for(let i=0;i<10;i++) particles.push({x:this.x+Math.random()*this.w,y:this.y+Math.random()*this.h,dx:0,dy:0,life:10,c:"#475569"}); this.performAttack(s[Math.floor(Math.random() * s.length)]); return; }
                if (aType === 'striker') { this.cd = 20; const r = 52; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 15, 1.5); } 
                else if (aType === 'gunner') { this.cd = 40; if (k[this.controls.down] || (this.isCPU && t.y > this.y + 50 && Math.abs(t.x - this.x) < 50)) bullets.push({ x: this.x + this.w/2 - 7, y: this.y + this.h, dx: 0, dy: 14, owner: this.id, size: 14 }); else bullets.push({ x: this.x + (this.dir > 0 ? 35 : -5), y: this.y + 22, dx: this.dir * 14, dy: 0, owner: this.id, size: 14 }); } 
                else if (aType === 'laser') { if (this.charge === 0) this.charge = 1; } 
                else if (aType === 'bomber') { this.cd = 30; bombs.push({ x: this.x + (this.dir > 0 ? 30 : -30), y: this.y + this.h - 32, w: 32, h: 32, timer: 120, owner: this.id, exploded: false }); } 
                else if (aType === 'titan') { this.cd = 70; setTimeout(() => { this.dashTimer = 15; this.dx = this.dir * 18; }, 200); } 
                else if (aType === 'ninja') { if (!this.grounded && this.ninjaAtkCount >= 2) return; this.cd = 25; this.dy = -13; if (!this.grounded) this.ninjaAtkCount++; const r = 45; const hX = this.x - 10; if (hX < t.x + t.w && hX + r + 20 > t.x && this.y - 40 < t.y + t.h && this.y + this.h > t.y) this.hit(t, 2.5, 1.6, 0, -1.3); } 
                else if (aType === 'grappler') { this.cd = 60; const r = 52; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { if (!t.isGrabbed && t.invTimer === 0) { this.grabbedTarget = t; t.isGrabbed = true; t.shieldActive = 0; t.escapeMashingCount = 0; this.grabTimer = 180; this.justGrabbed = 15; } } } 
                else if (aType === 'thunder') { this.cd = 90; this.thunderCharge = 60; } 
                else if (aType === 'boomerang') { if (!this.hasBoomerang) { this.isAtk = false; return; } this.hasBoomerang = false; this.cd = 10; boomerangs.push({ x: this.x + (this.dir === 1 ? this.w : 0), y: this.y + this.h / 2, dx: this.dir * 14, owner: this.id, range: this.w * 7.5, startX: this.x, state: 'outward', angle: 0, hitTargets: [] }); } 
                else if (aType === 'pink' || aType === 'command') { this.cd = 15; const r = this.w; let hX = this.x; let hY = this.y; let hW = this.w; let hH = this.h; let kx = null; let ky = null; let mult = aType==='command'?2:1; if (k[this.controls.up]) { hY = this.y - r*mult; hH = r*mult; kx = 0; ky = -1.2*mult; for(let i=0; i<5; i++) particles.push({ x: this.x+this.w/2, y: this.y, dx: (Math.random()-0.5)*5, dy: -Math.random()*10, life: 10, c: this.color }); } else if (k[this.controls.down]) { hY = this.y + this.h; hH = r*mult; kx = 0; ky = 1.2*mult; for(let i=0; i<5; i++) particles.push({ x: this.x+this.w/2, y: this.y+this.h, dx: (Math.random()-0.5)*5, dy: Math.random()*10, life: 10, c: this.color }); } else { hX = (this.dir === 1) ? this.x + this.w : this.x - r*mult; hW = r*mult; for(let i=0; i<5; i++) particles.push({ x: this.dir===1 ? this.x+this.w : this.x, y: this.y+this.h/2, dx: this.dir*Math.random()*10, dy: (Math.random()-0.5)*5, life: 10, c: this.color }); } if (hX < t.x + t.w && hX + hW > t.x && hY < t.y + t.h && hY + hH > t.y) this.hit(t, 3*mult, 0.8*mult, kx, ky); } 
                else if (aType === 'wind') { this.cd = 30; const r = 30; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 2, 4.0); } 
                else if (aType === 'ice') { this.cd = 40; bullets.push({ x: this.x + (this.dir>0?this.w:-10), y: this.y+20, dx: this.dir*12, dy: 0, owner: this.id, size: 10, effect: 'ice', c: colors.ice }); } 
                else if (aType === 'magma') { this.cd = 40; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 10, 1.2, null, null, 'magma'); } 
                else if (aType === 'blade') { this.cd = 30; const r = 80; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 15, 1.3); } 
                else if (aType === 'slime') { this.cd = 50; bullets.push({ x: this.x + (this.dir>0?this.w:-10), y: this.y+20, dx: this.dir*8, dy: -6, owner: this.id, size: 14, effect: 'slime', c: colors.slime }); bullets.push({ x: this.x + this.w/2 - 7, y: this.y-10, dx: 0, dy: -10, owner: this.id, size: 14, effect: 'slime', c: colors.slime }); } 
                else if (aType === 'meteor') { this.cd = 60; if (!this.grounded) { this.meteorActive = true; this.dy = 15; this.dx = 0; } } 
                else if (aType === 'battery') { this.cd = 30; const m = 1 + (this.batteryCharge/50); const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 10*m, 1.2*m); this.batteryCharge = 0; } 
                else if (aType === 'drill') { this.cd = 60; this.drillTimer = 30; } 
                else if (aType === 'pulse') { this.cd = 90; pulseEffects.push({x: this.x+this.w/2, y: this.y+this.h/2, life: 20, maxR: 100, owner: this.id}); const dist = Math.hypot(t.x+t.w/2 - (this.x+this.w/2), t.y+t.h/2 - (this.y+this.h/2)); if (dist > 40 && dist < 100) this.hit(t, 12, 1.8, t.x>this.x?1.5:-1.5, -1.0); } 
                else if (aType === 'orbit') { this.cd = 120; orbits.push({ owner: this.id, angle: 0, r: 60, life: 240 }); orbits.push({ owner: this.id, angle: Math.PI, r: 60, life: 240 }); } 
                else if (aType === 'gravity') { this.cd = 40; const hX = this.x; const hW = this.w; const hY = this.y + this.h; const hH = this.h * 0.7; if (hX < t.x + t.w && hX + hW > t.x && hY < t.y + t.h && hY + hH > t.y) this.hit(t, 8, 1.0, null, null, 'gravity'); } 
                else if (aType === 'quake') { this.cd = 120; this.quakeCharge = 60; gameQuakeTimer = 60; } 
                else if (aType === 'phantom') { this.cd = 90; phantoms.push({x: this.x, y: this.y, w: this.w, h: this.h, dir: -this.dir, life: 120, owner: this.id, color: this.color}); } 
                else if (aType === 'acid') { this.cd = 90; acidAreas.push({x: this.x, y: this.y+this.h-10, w: 80, h: 10, life: 300, owner: this.id}); } 
                else if (aType === 'mirror') { this.cd = 60; this.mirrorTimer = 30; } 
                else if (aType === 'spark') { this.cd = 60; bullets.push({ x: this.x + (this.dir>0?this.w:-10), y: this.y+20, dx: this.dir*15, dy: 0, owner: this.id, size: 8, effect: 'spark', c: colors.spark }); } 
                else if (aType === 'drone') { if (drones.filter(d => d.owner === this.id).length >= 2) { this.isAtk = false; return; } this.cd = 120; drones.push({x: this.x + this.w/2, y: this.y-30, life: 300, owner: this.id}); } 
                else if (aType === 'void') { this.cd = 20; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 12, 1.2); } 
                else if (aType === 'burst') { this.cd = 120; const oX = Math.max(0, Math.min(this.x + this.w, t.x + t.w) - Math.max(this.x, t.x)); const oY = Math.max(0, Math.min(this.y + this.h, t.y + t.h) - Math.max(this.y, t.y)); if (oX > 0 && oY > 0 && (oX * oY) / (this.w * this.h) >= 0.8) { t.hp = 0; t.dmg = 999; t.die(); } else { this.hp = 0; this.dmg = 999; this.die(); } } 
                else if (aType === 'remote') { const mb = bombs.find(b => b.owner === this.id && b.remote && !b.exploded); if (mb) { mb.timer = 0; this.cd = 15; } else { this.cd = 15; bombs.push({ x: this.x + (this.dir > 0 ? this.w : -16), y: this.y + this.h/2 - 16, w: 16, h: 16, dx: this.dir * 6, dy: -6, timer: 9999, owner: this.id, remote: true, exploded: false }); } }
                else if (aType === 'timeslip') { 
                    this.cd = 30; 
                    const reach = this.w * 10; 
                    const isUp = k[this.controls.up];
                    let beamX, beamY, beamW, beamH;
                    if (isUp) {
                        beamX = this.x; beamY = this.y - reach; beamW = this.w; beamH = reach;
                    } else {
                        beamX = (this.dir === 1) ? this.x + this.w : this.x - reach; beamY = this.y; beamW = reach; beamH = this.h;
                    }
                    lasers.push({ type: 'timeslip', x: beamX, y: beamY, w: beamW, h: beamH, owner: this.id, life: 15, isUp: isUp });
                }
                else if (aType === 'lagger') { this.cd = 30; const r = 60; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; for(let i=0; i<5; i++) particles.push({ x: this.x+this.w/2, y: this.y+this.h/2, dx: this.dir*Math.random()*5, dy: (Math.random()-0.5)*5, life: 15, c: this.color }); if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 8, 1.0, null, null, 'lagger'); }
                else if (aType === 'uithief') { this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 8, 1.0, null, null, 'uithief'); }
                else if (aType === 'director') { this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 10, 1.2, null, null, 'director'); }
                else if (aType === 'flipper') { this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 5, 1.0, null, null, 'flipper'); }
                else if (aType === 'grav_master') { this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 5, 1.0, null, null, 'randgrav'); }
                else if (aType === 'painter') { this.cd = 45; painterBlocks.push({x: Math.random()*(canvas.width-50), y: Math.random()*(canvas.height-100), w: 50+Math.random()*50, h: 10, life: 300, owner: this.id}); }
                else if (aType === 'magnet') { this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) this.hit(t, 5, 1.0, null, null, 'magnet'); }
                else if (aType === 'ice_run') { this.cd = 40; this.dashTimer = 20; this.dx = this.dir * 12; }
                else if (aType === 'portal') { this.cd = 60; portals.push({x: this.x, y: this.y, w: 20, h: 40}); if(portals.length>2) portals.shift(); }
                else if (aType === 'gambler') { this.cd = 40; const r = 60; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { const dice = Math.floor(Math.random()*6)+1; if(dice===1) { this.hp-=20; this.dmg+=20; } else if(dice===2) { this.hit(t, 5, 0.5); } else if(dice===3) { this.hit(t, 10, 1.0); } else if(dice===4) { this.hit(t, 10, 1.0, null, null, 'spark'); } else if(dice===5) { this.hit(t, 30, 1.5); } else if(dice===6) { t.hp=0; t.dmg=999; t.die(); } } }
                else if (aType === 'reflector') { this.cd = 60; this.mirrorTimer = 30; }
                else if (aType === 'sizer') { this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { this.hit(t, 5, 1.0); const oldH = t.h; t.w = 20 + Math.random()*40; t.h = 30 + Math.random()*40; t.y += (oldH - t.h); } else { const oldH = this.h; this.w = 20 + Math.random()*40; this.h = 30 + Math.random()*40; this.y += (oldH - this.h); } }
                else if (aType === 'cursor') { this.cd = 90; drones.push({x: this.x + this.w/2, y: this.y-30, life: 180, owner: this.id, cursor: true}); }
                else if (aType === 'vampire') { 
                    this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; 
                    if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { 
                        const dGiven = this.hit(t, 12, 1.0, null, null, 'vampire_curse'); 
                        if (dGiven > 0) { if (config.mode === 'hp') { const mx = parseInt(document.getElementById(isOnlineMode ? 'online-mode-val' : 'mode-val').value); this.hp = Math.min(mx, this.hp + dGiven * 1.8); } else { this.dmg = Math.max(0, this.dmg - dGiven * 1.8); } } 
                    } 
                    bats.push({ owner: this.id, angle: 0, r: 60, life: 300 }); 
                    bats.push({ owner: this.id, angle: Math.PI, r: 60, life: 300 }); 
                }
                else if (aType === 'illusion') { this.cd = 60; illusions.push({ x: this.x - 50, y: this.y, w: this.w, h: this.h, owner: this.id, life: 180, dx: -2 }); illusions.push({ x: this.x + 50, y: this.y, w: this.w, h: this.h, owner: this.id, life: 180, dx: 2 }); }
                else if (aType === 'dancer') { 
                    this.cd = 30; 
                    const timeSinceBeat = Date.now() - lastBeatTime;
                    if (timeSinceBeat < 150 || timeSinceBeat > 450) {
                        ctx.fillStyle = "rgba(244, 114, 182, 0.6)"; ctx.fillRect(-1000, -1000, 3000, 3000); 
                        this.hit(t, 25, 2.5); 
                        for(let i=0; i<30; i++) particles.push({ x: t.x+t.w/2, y: t.y+t.h/2, dx: (Math.random()-0.5)*25, dy: (Math.random()-0.5)*25, life: 40, c: "#f472b6" });
                    } else {
                        const r = 60; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; 
                        if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { this.hit(t, 5, 0.5); }
                    }
                }
                else if (aType === 'evo_slime') { this.cd = 30; const r = this.w * 1.5; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { this.hit(t, 10, 1.2); this.type = t.type; this.color = t.color; Object.keys(colors).forEach(k => { this['is' + k.charAt(0).toUpperCase() + k.slice(1)] = (this.type === k); }); } }
                else if (aType === 'copycat') { this.cd = 30; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { this.hit(t, 5, 1.0); this.type = t.type; this.color = t.color; Object.keys(colors).forEach(k => { this['is' + k.charAt(0).toUpperCase() + k.slice(1)] = (this.type === k); }); } }
                else if (aType === 'paper') { this.cd = 30; bullets.push({ x: this.x + (this.dir>0?this.w:-10), y: this.y+20, dx: this.dir*10, dy: 0, owner: this.id, size: 10, effect: null, c: colors.paper }); }
                else if (aType === 'squid') { this.cd = 60; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { this.hit(t, 5, 1.0); inks.push({x: Math.random()*600+100, y: Math.random()*400+100, r: 80+Math.random()*40, life: 180}); } }
                else if (aType === 'turtle') { this.cd = 40; this.dashTimer = 15; this.dx = this.dir * 10; }
                else if (aType === 'zombie') { this.cd = 40; bullets.push({ x: this.x + (this.dir>0?this.w:-10), y: this.y+10, dx: this.dir*6, dy: 2, owner: this.id, size: 12, effect: 'magma', c: "#14532d" }); }
                else if (aType === 'present') { this.cd = 90; presents.push({x: this.x+(this.dir*40), y: this.y-20, dy:-5, dx:this.dir*3, life: 180}); }
                else if (aType === 'silencer') { this.cd = 180; const r = 50; const hX = (this.dir === 1) ? this.x + this.w : this.x - r; if (hX < t.x + t.w && hX + r > t.x && this.y < t.y + t.h && this.y + this.h > t.y) { this.hit(t, 5, 1.0); silencerAlpha = 1.0; } }
                else if (aType === 'shadow') { this.cd = 120; this.x = t.x; this.y = t.y; this.hit(t, 5, 0, null, null, 'spark'); }
                else if (aType === 'error') { this.cd = 40; bullets.push({ x: this.x + (this.dir>0?this.w:-10), y: this.y+20, dx: this.dir*8, dy: 0, owner: this.id, size: 15, effect: 'error', c: "#ff00ff" }); }
                
                if (!['thunder', 'glitch', 'quake'].includes(aType)) setTimeout(() => this.isAtk = false, 150);
            }

            fireQuake() { const t = players.find(p => p.id !== this.id); if (t && t.grounded) { ctx.fillStyle = "rgba(161, 98, 7, 0.5)"; ctx.fillRect(0, canvas.height - 150, canvas.width, 150); this.hit(t, 10, 1.5, 0, -2.0); } }
            executeThrow() { if (!this.grabbedTarget) return; this.grabbedTarget.shieldActive = 0; this.hit(this.grabbedTarget, 20, 1.2, this.dir * 1.0, -1.0); this.grabbedTarget.isGrabbed = false; this.grabbedTarget.escapeMashingCount = 0; this.grabbedTarget = null; this.grabTimer = 0; this.isAtk = true; setTimeout(() => this.isAtk = false, 150); }
            escapeGrab() { const g = players.find(p => p.grabbedTarget === this); if (g) { g.grabbedTarget = null; g.grabTimer = 0; g.cd = 30; this.dx = (this.x < g.x ? -5 : 5); this.dy = -6; g.dx = (g.x < this.x ? -3 : 3); } this.isGrabbed = false; this.escapeMashingCount = 0; for(let i=0; i<20; i++) particles.push({ x: this.x+this.w/2, y: this.y+this.h/2, dx: (Math.random()-0.5)*20, dy: (Math.random()-0.5)*20, life: 25, c: "#fbbf24" }); }
            fireLaser() { const r = 130; const s = [{ x: this.x + (this.dir === 1 ? this.w : -r), y: this.y + 10 }, { x: this.x + (this.dir === 1 ? -r : this.w), y: this.y + 10 }]; s.forEach(sd => lasers.push({ x: sd.x, y: sd.y, w: r, h: 50, owner: this.id, life: 15 })); }
            fireThunder() { const r = this.h * 3; const w = this.w * 1.5; const hX = this.x + this.w/2 - w/2; const hY = this.y - r; thunders.push({ x: hX, y: hY, w: w, h: r + this.h, life: 15, owner: this.id }); }

            hit(target, val, kb, customDx = null, customDy = null, effect = null) {
                if (target.invTimer > 0) return 0;
                
                if (target.isDancer && target.hasDancerBarrier) {
                    target.hasDancerBarrier = false;
                    for(let i=0; i<15; i++) particles.push({ x: target.x+target.w/2, y: target.y+target.h/2, dx: (Math.random()-0.5)*15, dy: (Math.random()-0.5)*15, life: 20, c: "#f472b6" });
                    return 0; 
                }

                if (target.isPaper && target.dir === this.dir) { val = 0; kb = 0; } 
                if (target.isError || effect === 'error') errorTimerGlobal = 30;
                
                if (target.mirrorTimer > 0 && effect !== 'reflect') { for(let i=0; i<10; i++) particles.push({ x: target.x+target.w/2, y: target.y+target.h/2, dx: (Math.random()-0.5)*10, dy: (Math.random()-0.5)*10, life: 20, c: "#06b6d4" }); target.hit(this, val, kb, -this.dir, null, 'reflect'); return 0; }
                if (target.isStriker && target.shieldActive > 0) { if (target.dir === (this.x < target.x ? -1 : 1)) { for(let i=0; i<10; i++) particles.push({ x: target.x+(target.dir===1?target.w:0), y: target.y+target.h/2, dx: target.dir*Math.random()*10, dy: (Math.random()-0.5)*10, life: 20, c: "#3b82f6" }); val *= 0.5; kb *= 0.5; } }
                if (target.isPink) val *= 0.5;
                if (this.isPhantom && phantoms.filter(p => p.owner === this.id).length === 0) val *= 0.75;
                if (this.isVoid) { const ab = val * 0.1; if (config.mode === 'hp') { const mx = parseInt(document.getElementById(isOnlineMode ? 'online-mode-val' : 'mode-val').value); this.hp = Math.min(mx, this.hp + ab); } else { this.dmg = Math.max(0, this.dmg - ab); } }

                if (effect === 'ice') target.speedTimer = 120;
                if (effect === 'magma') target.burnTimer = 180;
                if (effect === 'slime') target.jumpTimer = 120;
                if (effect === 'gravity') target.gravityTimer = 180;
                if (effect === 'spark') target.stunTimer = 60;
                if (effect === 'lagger') target.stunTimer = 6;
                if (effect === 'uithief') target.uiThiefTimer = 300;
                if (effect === 'director' || this.isDirector) { globalCameraZoom = 0.7 + Math.random() * 0.8; globalCameraAngle = (Math.random() - 0.5) * 0.5; }
                if (effect === 'flipper') target.flipTimer = 180;
                if (effect === 'randgrav' || this.isGrav_master) globalGravityModifier = Math.random() * 2.0;
                if (effect === 'magnet') { target.magnetTimer = 180; target.magnetDir = Math.random()>0.5?1:-1; }
                if (effect === 'vampire_curse') target.vampireCurseTimer = 300;

                let ratio = 0.85 + Math.random() * 0.3; if (this.type === 'laser') ratio = 0.8 + Math.random() * 0.7; 
                const finalVal = val * ratio;
                if (config.mode === 'hp') { target.hp -= finalVal; if (target.hp <= 0) target.die(); } else { target.dmg += finalVal; }
                
                const power = (config.mode === 'hp' ? 6 : (6 + target.dmg * 0.22)) * kb * target.weight;
                if (target.weight > 0) {
                    target.dx = customDx !== null ? customDx * power : this.dir * power;
                    target.dy = customDy !== null ? customDy * power : -power * 0.4 - 2;
                }
                
                for(let i=0; i<10; i++) particles.push({ x: target.x+15, y: target.y+20, dx: (Math.random()-0.5)*15, dy: (Math.random()-0.5)*15, life: 20, c: "#fff" });
                return finalVal;
            }

            die(force) {
                if (this.hp <= 0 && this.stocks <= 0 && this.isZombie && !this.isZombieActive && !force) { this.isZombieActive = true; this.zombieTimer = 600; this.hp = 1; this.x = 400; this.y = 100; return; }
                if (this.grabbedTarget) { this.grabbedTarget.isGrabbed = false; this.grabbedTarget = null; }
                const g = players.find(p => p.grabbedTarget === this); if (g) { g.grabbedTarget = null; g.grabTimer = 0; }

                let bx = Math.max(0, Math.min(canvas.width, this.x + this.w / 2)); let by = Math.max(0, Math.min(canvas.height, this.y + this.h / 2));
                burstEffects.push({ x: bx, y: by, timer: 40, color: this.color });
                for(let i=0; i<20; i++) particles.push({ x: bx, y: by, dx: (Math.random()-0.5)*35, dy: (Math.random()-0.5)*35, life: 40, c: this.color });
                for(let i=0; i<15; i++) particles.push({ x: bx, y: by, dx: (Math.random()-0.5)*25, dy: (Math.random()-0.5)*25, life: 30, c: "#fff" });

                const killer = players.find(p => p.id !== this.id); if (killer) killer.score++;
                if (config.mode === 'stock') { this.stocks--; if (this.stocks <= 0) { gameActive = false; determineWinner(killer); } }
                
                const mVal = isOnlineMode ? parseInt(document.getElementById('online-mode-val').value) : parseInt(document.getElementById('mode-val').value);
                this.dmg = 0; this.hp = mVal; this.charge = 0; this.thunderCharge = 0; this.batteryCharge = 0; this.hasBoomerang = true; 
                this.respawnTimer = 60; this.x = -2000; this.jumpCount = 0; this.isGrabbed = false; this.escapeMashingCount = 0;
                this.stunTimer = 0; this.speedTimer = 0; this.jumpTimer = 0; this.gravityTimer = 0; this.burnTimer = 0; this.mirrorTimer = 0;
                this.buriedTimer = 0; this.quakeCharge = 0; this.w = this.baseW; this.h = this.baseH; this.vampireCurseTimer = 0;
                this.timeStopCd = 600; this.timeStopTimer = 0;
                this.dancerBarrierTimer = 300; this.hasDancerBarrier = this.isDancer ? true : false;
                boomerangs.forEach(b => { if(b.owner === this.id) b.shouldRemove = true; });
                bombs.forEach(b => { if(b.owner === this.id && b.remote) b.exploded = true; });
                bats.forEach(b => { if(b.owner === this.id) b.life = 0; });
            }

            spawn() { this.x = (this.id === 1) ? 200 : 600; this.y = 150; this.dx = 0; this.dy = 0; this.invTimer = 60; }

            darken(c, p) { let r = parseInt(c.substring(1,3), 16); let g = parseInt(c.substring(3,5), 16); let b = parseInt(c.substring(5,7), 16); r = Math.floor(r * p); g = Math.floor(g * p); b = Math.floor(b * p); return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`; }

            drawSprite(ctx) {
                const time = frameCount * 0.2; let state = 'idle';
                if (this.isGrabbed) state = 'grabbed'; else if (!this.grounded) state = 'jump'; else if (Math.abs(this.dx) > 0.5) state = 'run';
                if (this.isAtk) state = 'attack'; if (this.dashTimer > 0) state = 'dash';

                let headY = -this.h + (this.h * 0.2); let armRotR = 0, armRotL = 0, legRotR = 0, legRotL = 0, bodyRot = 0;

                if (state === 'grabbed') { armRotR = Math.sin(time*3); armRotL = -Math.sin(time*3); legRotR = Math.sin(time*3); legRotL = -Math.sin(time*3); bodyRot = 0.5; headY -= 5; } 
                else if (state === 'run') { const sway = Math.sin(time); legRotR = sway * 0.6; legRotL = -sway * 0.6; armRotR = -sway * 0.6; armRotL = sway * 0.6; headY += Math.abs(Math.sin(time * 2)) * 2; bodyRot = 0.1; } 
                else if (state === 'jump') { legRotR = -0.2; legRotL = 0.5; armRotR = -2.5; armRotL = -0.5; bodyRot = -0.1; } 
                else if (state === 'dash') { legRotR = 0.5; legRotL = 0.8; armRotR = -1.0; armRotL = -1.5; bodyRot = 0.4; headY += 5; }

                if (state === 'attack') {
                    if (this.isNinja) { armRotR = -2.8; armRotL = 0.5; legRotR = -0.2; legRotL = 0.6; bodyRot = -0.2; }
                    else if (this.isGunner) { armRotR = (keys[this.controls.down] && !this.grounded) ? 1.5 : -1.5; bodyRot = 0.2; }
                    else if (this.isStriker) { armRotR = -1.5; armRotL = 0.8; legRotR = 0.4; legRotL = -0.4; bodyRot = 0.3; }
                    else if (this.isGrappler) { armRotR = -2.0; armRotL = -1.8; legRotR = 0.3; legRotL = -0.3; bodyRot = 0.3; }
                    else if (this.isThunder) { armRotR = -3.0; armRotL = -3.0; legRotR = 0; legRotL = 0; bodyRot = -0.1; }
                    else if (this.isBoomerang) { armRotR = -2.0; armRotL = 0.5; bodyRot = 0.2; }
                    else if (this.isPink || this.isCommand) { if (keys[this.controls.up]) { armRotR = -3.1; armRotL = -3.1; bodyRot = -0.1; } else if (keys[this.controls.down]) { armRotR = 1.5; armRotL = 1.5; bodyRot = 0.4; } else { armRotR = -1.5; armRotL = 0.8; bodyRot = 0.3; } } 
                    else if (this.isWind || this.isBattery || this.isBurst || this.isTimebomb) { armRotR = -1.8; armRotL = -1.8; bodyRot = 0.2; }
                    else if (this.isIce || this.isSlime || this.isSpark || this.isDrone || this.isEvo_slim) { armRotR = -1.5; armRotL = -1.5; bodyRot = 0; }
                    else if (this.isMagma || this.isQuake || this.isAcid) { armRotR = 1.5; armRotL = 1.5; bodyRot = 0.5; }
                    else if (this.isBlade) { armRotR = -2.8; armRotL = 0.5; bodyRot = 0.2; }
                    else if (this.isMeteor) { armRotR = -3.1; armRotL = -3.1; bodyRot = 0.5; legRotR = 0.5; legRotL = -0.5; }
                    else if (this.isDrill) { armRotR = -1.5; armRotL = 0.5; bodyRot = 0.2; }
                    else if (this.isPulse || this.isOrbit || this.isGravity || this.isVoid || this.isTimeslip) { armRotR = -1.5; armRotL = 1.5; bodyRot = 0; }
                    else if (this.isMirror || this.isReflector || this.isGlitch) { armRotR = -1.0; armRotL = 1.0; bodyRot = 0; }
                    else if (this.isRemote) { armRotR = -2.5; armRotL = 0.5; bodyRot = 0.2; }
                    else if (this.isZombie) { armRotR = -2.0; armRotL = -2.0; bodyRot = 0.3; }
                    else if (this.isTurtle) { armRotR = 0; armRotL = 0; bodyRot = 0; }
                    else if (this.isError) { armRotR = -1.5; armRotL = -1.5; bodyRot = 0; }
                    else if (this.isVampire) { armRotR = -2.0; armRotL = 0.5; bodyRot = 0.2; }
                    else { armRotR = -1.5; armRotL = 0.5; bodyRot = 0.2; }
                }
                if (this.isGrappler && this.grabbedTarget) { armRotR = -2.0; armRotL = -1.8; bodyRot = 0.2; }

                const isB = this.type === 'bomber'; const isS = this.isSlime || this.isEvo_slim; const isD = this.isDrone || this.isCursor;
                const isGhost = this.isGhost_p || this.isPhantom || this.isShadow;
                const isRound = this.type === 'bomber' || this.isTimebomb || this.isOrbit || this.isPulse || this.isVoid;
                
                const hw = this.w / 2; const bodyW = this.isTitan || this.isQuake || this.isTurtle || this.isSizer ? hw + 6 : hw; 
                const legH = this.h * 0.35; const armH = this.h * 0.4;
                const dCol = this.darken(this.color, 0.6);

                ctx.shadowBlur = 10; ctx.shadowColor = this.color;
                
                if (this.isGlitch || this.isError) { ctx.translate((Math.random()-0.5)*6, (Math.random()-0.5)*6); }
                if (isGhost) ctx.globalAlpha *= 0.5;

                ctx.save(); ctx.translate(0, headY + 10); ctx.rotate(armRotL); ctx.fillStyle = dCol; ctx.beginPath(); ctx.roundRect(-4, -4, 8, armH, 4); ctx.fill(); ctx.restore();
                if(!isS && !isD && !isGhost && !this.isPaper) { ctx.save(); ctx.translate(0, -legH); ctx.rotate(legRotL); ctx.fillStyle = dCol; ctx.beginPath(); ctx.roundRect(-5, 0, 10, legH, 4); ctx.fill(); ctx.restore(); }

                if (this.isVampire) { 
                    const boneColor = "#200"; const membraneColor = "#400";
                    ctx.save(); ctx.translate(0, headY + 15); 
                    ctx.save(); ctx.translate(-5, 0); ctx.fillStyle = boneColor; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -10); ctx.lineTo(-30, -5); ctx.lineTo(-20, 10); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = membraneColor; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.quadraticCurveTo(-15, -15, -25, -5); ctx.quadraticCurveTo(-20, 5, -5, -5); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1.0; ctx.restore();
                    ctx.save(); ctx.translate(5, 0); ctx.scale(-1, 1); ctx.fillStyle = boneColor; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -10); ctx.lineTo(-30, -5); ctx.lineTo(-20, 10); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = membraneColor; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.moveTo(-5, -5); ctx.quadraticCurveTo(-15, -15, -25, -5); ctx.quadraticCurveTo(-20, 5, -5, -5); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1.0; ctx.restore();
                    ctx.restore(); 
                }
                if (this.isWind) { ctx.fillStyle = "#86efac"; ctx.globalAlpha *= 0.6; ctx.beginPath(); ctx.moveTo(-bodyW, headY+10); ctx.quadraticCurveTo(-bodyW-20, headY+30+Math.sin(time)*10, -bodyW-10, this.h); ctx.lineTo(-bodyW+10, this.h); ctx.fill(); ctx.globalAlpha = this.invTimer > 0 && Math.floor(frameCount / 5) % 2 === 0 ? 0.5 : 1; }
                
                ctx.save(); ctx.translate(0, headY + 10); ctx.rotate(bodyRot); ctx.fillStyle = this.color;
                if (isRound) { ctx.beginPath(); ctx.arc(0, 10, bodyW, 0, Math.PI * 2); ctx.fill(); } 
                else if (isS) { ctx.beginPath(); ctx.moveTo(-bodyW-5, 25); ctx.quadraticCurveTo(0, -10, bodyW+5, 25); ctx.fill(); }
                else if (this.isQuake) { ctx.fillRect(-bodyW-2, -5, bodyW*2+4, this.h*0.5); }
                else if (this.isTurtle) { ctx.beginPath(); ctx.arc(0, 5, bodyW, 0, Math.PI*2); ctx.fill(); ctx.fillStyle="#333"; ctx.beginPath(); ctx.arc(0, 5, bodyW+2, 0, Math.PI, true); ctx.fill(); }
                else if (this.isPortal) { ctx.beginPath(); ctx.roundRect(-bodyW/2, 0, bodyW, this.h * 0.4, 4); ctx.fill(); ctx.fillStyle="#000"; ctx.beginPath(); ctx.arc(0, 15, 8, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle="#8b5cf6"; ctx.lineWidth=2; ctx.stroke(); }
                else if (this.isUithief) { ctx.beginPath(); ctx.roundRect(-bodyW/2, 0, bodyW, this.h * 0.4, 4); ctx.fill(); ctx.fillStyle="#16a34a"; ctx.fillRect(-bodyW/2-2, 0, bodyW+4, 15); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(-4, 5, 2, 0, 6); ctx.arc(6, 10, 2, 0, 6); ctx.fill(); }
                else { ctx.beginPath(); ctx.roundRect(-bodyW/2, 0, bodyW, this.h * 0.4, 4); ctx.fill(); }
                
                if (this.isGravity || this.isGrav_master) { ctx.fillStyle="#fff"; ctx.beginPath(); ctx.moveTo(-6, 5); ctx.lineTo(6, 5); ctx.lineTo(0, 15); ctx.fill(); }
                if (this.isMirror || this.isReflector) { ctx.fillStyle="rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.moveTo(-bodyW/2+2, 2); ctx.lineTo(bodyW/2-2, 12); ctx.lineTo(bodyW/2-2, 15); ctx.lineTo(-bodyW/2+2, 5); ctx.fill(); }
                if (this.isPulse) { ctx.strokeStyle="rgba(255,255,255,0.5)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0, 10, (time*10)%20, 0, Math.PI*2); ctx.stroke(); }
                if (isD) { ctx.fillStyle="#f87171"; ctx.beginPath(); ctx.moveTo(-5, this.h*0.4); ctx.lineTo(0, this.h*0.4+10+Math.random()*5); ctx.lineTo(5, this.h*0.4); ctx.fill(); }
                if (this.isPaper) { ctx.fillStyle="#fff"; ctx.globalAlpha=0.8; ctx.beginPath(); ctx.moveTo(-bodyW, 0); ctx.lineTo(bodyW, 5); ctx.lineTo(-bodyW, 10); ctx.fill(); ctx.globalAlpha=1; }
                if (this.isTimebomb || this.type === 'bomber') { ctx.fillStyle = "#fbbf24"; ctx.fillRect(-2, -15, 4, 10); ctx.fillStyle = (frameCount%10<5)?"#f00":"#ff0"; ctx.beginPath(); ctx.arc(0, -15, 3, 0, Math.PI*2); ctx.fill(); }
                if (this.isSquid) { ctx.fillStyle=this.color; ctx.beginPath(); ctx.moveTo(-bodyW, 0); ctx.lineTo(-bodyW-10, 20); ctx.lineTo(-bodyW+5, 10); ctx.moveTo(bodyW, 0); ctx.lineTo(bodyW+10, 20); ctx.lineTo(bodyW-5, 10); ctx.fill(); }
                ctx.restore();

                ctx.save(); ctx.translate(0, headY); ctx.rotate(bodyRot * 0.5); ctx.fillStyle = this.color;
                
                if (isRound) { ctx.beginPath(); ctx.arc(0, 0, hw + 2, 0, Math.PI * 2); ctx.fill(); } 
                else if (isS) { ctx.beginPath(); ctx.arc(0, 5, hw, 0, Math.PI * 2); ctx.fill(); }
                else if (this.isIce || this.isIce_run) { ctx.beginPath(); ctx.moveTo(-hw, hw); ctx.lineTo(-hw, -hw/2); ctx.lineTo(-hw/2, -hw-5); ctx.lineTo(0, -hw/2); ctx.lineTo(hw/2, -hw-8); ctx.lineTo(hw, -hw/2); ctx.lineTo(hw, hw); ctx.fill(); }
                else if (this.isMagma) { ctx.beginPath(); ctx.arc(0,0,hw+2,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fbbf24"; ctx.beginPath(); ctx.moveTo(-hw,-5); ctx.lineTo(-hw/2,-hw-Math.random()*10); ctx.lineTo(0,-5); ctx.lineTo(hw/2,-hw-5-Math.random()*10); ctx.lineTo(hw,-5); ctx.fill(); }
                else if (this.isBurst || this.isTimebomb) { ctx.beginPath(); ctx.roundRect(-hw+2,-hw,this.w-4,hw*2,6); ctx.fill(); ctx.fillStyle="#333"; ctx.fillRect(-2,-hw-6,4,6); ctx.strokeStyle="#fff"; ctx.beginPath(); ctx.moveTo(0,-hw-6); ctx.lineTo(5,-hw-12); ctx.stroke(); ctx.fillStyle="#f00"; ctx.beginPath(); ctx.arc(5,-hw-12,2+Math.random()*2,0,9); ctx.fill(); }
                else if (this.isRemote) { ctx.beginPath(); ctx.roundRect(-hw+2,-hw,this.w-4,hw*2,6); ctx.fill(); ctx.fillStyle="#1e293b"; ctx.fillRect(-hw-2,-4,4,8); ctx.strokeStyle="#1e293b"; ctx.beginPath(); ctx.moveTo(-hw,-4); ctx.quadraticCurveTo(0,-hw-10,hw,-4); ctx.stroke(); ctx.fillStyle="#f00"; ctx.fillRect(hw-2,-4,2,2); }
                else if (this.isError) { ctx.fillRect(-hw, -hw, this.w, hw*2); ctx.fillStyle="#000"; ctx.fillText("ERR", 0, 5); }
                else if (this.isGhost_p) { ctx.fillStyle="#f8fafc"; ctx.beginPath(); ctx.arc(0,0,hw,Math.PI,0); ctx.lineTo(hw,hw+10); ctx.lineTo(hw-4,hw+5); ctx.lineTo(0,hw+10); ctx.lineTo(-hw+4,hw+5); ctx.lineTo(-hw,hw+10); ctx.fill(); }
                else { ctx.beginPath(); ctx.roundRect(-hw + 2, -hw, this.w - 4, hw * 2, 6); ctx.fill(); }
                
                ctx.fillStyle = (isRound || this.isStriker || this.isThunder || this.isBattery || this.isBurst || this.isGlitch || this.isRemote || this.type === 'bomber') ? "#000" : "#fff";
                if (this.type === 'laser') { ctx.fillStyle = "#ef4444"; ctx.fillRect(2, -4, hw, 6); }
                else if (this.isNinja) { ctx.fillRect(4, -2, 6, 4); ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.moveTo(-hw, 5); ctx.quadraticCurveTo(-hw-15, 10+Math.sin(time*2)*5, -hw-20, 5); ctx.lineTo(-hw-15, 0); ctx.fill(); } 
                else if (this.isVoid) { ctx.fillStyle = "#000"; ctx.fillRect(-hw+2, -hw, this.w-4, hw*2); ctx.fillStyle = "#c084fc"; ctx.beginPath(); ctx.arc(hw/2, -2, 3, 0, Math.PI*2); ctx.fill(); }
                else if (this.isMirror || this.isReflector) { ctx.fillStyle = "#e0f2fe"; ctx.fillRect(-hw+4, -hw+2, this.w-8, hw*2-4); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(-hw+6, -hw+4); ctx.lineTo(0, -hw+4); ctx.lineTo(-hw+6, 0); ctx.fill(); }
                else if (this.isBattery) { ctx.fillStyle = "#000"; ctx.fillRect(hw/2-3, -4, 2, 8); ctx.fillRect(hw/2-6, -1, 8, 2); ctx.fillRect(hw/2+6, -1, 4, 2); ctx.fillStyle="#fbbf24"; ctx.fillRect(-4, -hw-4, 8, 4); }
                else if (isD || this.isCursor) { ctx.fillStyle="#fff"; ctx.fillRect(2, -2, 6, 2); ctx.fillStyle="#94a3b8"; ctx.fillRect(-1, -hw-8, 2, 8); ctx.fillStyle="#ef4444"; ctx.beginPath(); ctx.arc(0, -hw-10, 3, 0, Math.PI*2); ctx.fill(); }
                else if (this.isZombie) { ctx.fillStyle="#000"; ctx.fillRect(hw/2-2, -4, 4, 4); ctx.fillStyle="#ef4444"; ctx.fillRect(hw/2-1, -3, 2, 2); ctx.strokeStyle="#000"; ctx.beginPath(); ctx.moveTo(-hw,hw-4); ctx.lineTo(hw,hw-8); ctx.stroke(); }
                else if (this.isError) { /* face drawn above */ }
                else if (this.isVampire) { ctx.fillStyle="#f00"; ctx.beginPath(); ctx.moveTo(hw/2, 0); ctx.lineTo(hw/2+2, 4); ctx.lineTo(hw/2+4, 0); ctx.fill(); }
                else if (this.isTimeslip) { ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(hw/2, 0, 4, 0, Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hw/2, 0); ctx.lineTo(hw/2, -3); ctx.moveTo(hw/2, 0); ctx.lineTo(hw/2+2, 2); ctx.stroke(); }
                else if (this.isUithief) { ctx.fillStyle="#333"; ctx.fillRect(-hw, hw/2-2, this.w, 4); }
                else if (this.isDirector) { ctx.fillStyle="#333"; ctx.fillRect(-hw, -hw-6, this.w, 6); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.moveTo(-hw,-hw); ctx.lineTo(-hw+4,-hw-6); ctx.lineTo(-hw+8,-hw); ctx.fill(); ctx.beginPath(); ctx.arc(hw/2, 0, 4, 0, Math.PI*2); ctx.stroke(); }
                else if (this.isFlipper) { ctx.fillStyle="#fff"; ctx.font="12px Inter"; ctx.fillText("⇄", hw/2, 4); }
                else if (this.isPainter) { ctx.fillStyle="#be123c"; ctx.beginPath(); ctx.ellipse(0,-hw,10,4,0,0,Math.PI*2); ctx.fill(); ctx.fillRect(hw/2, -4, 4, 4); }
                else if (this.isMagnet) { ctx.strokeStyle="#dc2626"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,-hw+4,hw-4,Math.PI,0); ctx.stroke(); ctx.fillStyle="#fff"; ctx.fillRect(-hw,-hw+4,3,3); ctx.fillRect(hw-3,-hw+4,3,3); ctx.fillRect(hw/2, -4, 4, 4); }
                else if (this.isGambler) { ctx.fillStyle="#fff"; ctx.fillRect(-hw+2,-hw+2,this.w-4,hw*2-4); ctx.fillStyle="#000"; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill(); }
                else if (this.isSizer) { ctx.fillStyle="#fff"; ctx.font="14px Inter"; ctx.fillText("↕", hw/2, 4); }
                else if (this.isCommand) { ctx.fillStyle="#fff"; ctx.font="10px Inter"; ctx.fillText("A", hw/2, 4); ctx.fillRect(-hw+2,-2,6,2); ctx.fillRect(-hw+4,-4,2,6); }
                else if (this.isDancer) { ctx.strokeStyle="#333"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,hw+2,Math.PI,0); ctx.stroke(); ctx.fillStyle="#ef4444"; ctx.fillRect(-hw-3,-4,3,8); ctx.fillRect(hw,-4,3,8); ctx.fillStyle="#000"; ctx.fillRect(hw/2, -4, 4, 4); }
                else if (this.isSquid) { ctx.fillStyle=this.color; ctx.beginPath(); ctx.moveTo(-hw,-hw); ctx.lineTo(0,-hw-12); ctx.lineTo(hw,-hw); ctx.fill(); ctx.fillStyle="#fff"; ctx.fillRect(hw/2, -4, 4, 4); }
                else if (this.isPresent) { ctx.fillStyle=this.color; ctx.fillRect(-hw,-hw,this.w,hw*2); ctx.fillStyle="#fff"; ctx.fillRect(-2,-hw,4,hw*2); ctx.fillRect(-hw,-2,this.w,4); ctx.fillStyle="#ef4444"; ctx.beginPath(); ctx.arc(-4,-hw-2,3,0,Math.PI*2); ctx.arc(4,-hw-2,3,0,Math.PI*2); ctx.fill(); }
                else if (this.isSilencer) { ctx.strokeStyle="#000"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(hw/2-3, 2); ctx.lineTo(hw/2+3, 6); ctx.moveTo(hw/2+3, 2); ctx.lineTo(hw/2-3, 6); ctx.stroke(); ctx.fillStyle="#fff"; ctx.fillRect(hw/2, -6, 4, 4); }
                else if (isRound || isB) { ctx.fillRect(hw/2+2, -2, 4, 4); }
                else { ctx.fillRect(hw/2, -4, 4, 4); } 
                
                if (this.isStriker) { ctx.fillStyle = "#fff"; ctx.fillRect(-hw - 10, -hw + 4, 10, 4); ctx.fillRect(-hw + 2, -hw + 4, this.w - 4, 4); }
                if (this.isThunder) { ctx.fillStyle="#fff"; ctx.beginPath(); ctx.moveTo(-hw+2,-hw); ctx.lineTo(-hw-4,-hw-8); ctx.lineTo(-hw+6,-hw); ctx.fill(); ctx.beginPath(); ctx.moveTo(hw-2,-hw); ctx.lineTo(hw+4,-hw-8); ctx.lineTo(hw-6,-hw); ctx.fill(); }
                if (this.isAcid) { ctx.fillStyle="#bef264"; ctx.beginPath(); ctx.arc(0,-hw,4,0,Math.PI); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2,-hw); ctx.lineTo(0,-hw-6); ctx.lineTo(2,-hw); ctx.fill(); }
                if (this.isSpark) { ctx.strokeStyle="#fff"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-hw-2,-hw+2); ctx.lineTo(-hw-8,-hw); ctx.lineTo(-hw-4,-hw-6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hw+2,-hw+2); ctx.lineTo(hw+8,-hw); ctx.lineTo(hw+4,-hw-6); ctx.stroke(); }
                if (this.isLagger) { ctx.strokeStyle="#7e22ce"; ctx.beginPath(); ctx.arc(0, -hw-5, 5, -Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -hw-5, 10, -Math.PI, 0); ctx.stroke(); }
                if (this.isDancer) { ctx.fillStyle="#000"; ctx.fillRect(-hw-2, -hw+5, 4, 10); ctx.fillRect(hw-2, -hw+5, 4, 10); ctx.beginPath(); ctx.arc(0, -hw, hw+2, Math.PI, 0); ctx.stroke(); } 
                ctx.restore();

                if(!isS && !isD && !isGhost && !this.isPaper) { 
                    ctx.save(); ctx.translate(0, -legH); ctx.rotate(legRotR); ctx.fillStyle = this.color; ctx.beginPath(); ctx.roundRect(-5, 0, 10, legH, 4); ctx.fill(); 
                    if (this.isIce_run) { ctx.fillStyle="#94a3b8"; ctx.fillRect(-6, legH-2, 12, 4); }
                    ctx.restore(); 
                }
                
                ctx.save(); ctx.translate(0, headY + 10); ctx.rotate(armRotR); ctx.fillStyle = this.color;
                if (this.isGunner) { ctx.fillStyle = "#475569"; ctx.beginPath(); ctx.roundRect(-6, -2, 16, armH + 5, 2); ctx.fill(); ctx.fillStyle = "#fbbf24"; ctx.fillRect(-6, armH - 4, 16, 6); }
                else if (this.isNinja || this.isBlade) { 
                    ctx.beginPath(); ctx.roundRect(-4, -4, 8, armH, 4); ctx.fill(); 
                    ctx.fillStyle = "#1e293b"; ctx.fillRect(-2, armH - 4, 4, 8); 
                    ctx.fillStyle = this.isBlade ? "#f8fafc" : "#cbd5e1"; 
                    ctx.beginPath(); ctx.moveTo(-2, armH + 4); ctx.lineTo(2, armH + 4); ctx.lineTo(1, armH + (this.isBlade?40:25)); ctx.lineTo(-1, armH + (this.isBlade?45:30)); ctx.fill(); 
                } 
                else if (this.isBoomerang) { ctx.beginPath(); ctx.roundRect(-4, -4, 8, armH, 4); ctx.fill(); if (this.hasBoomerang) { ctx.strokeStyle = "#84cc16"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, armH - 5); ctx.quadraticCurveTo(-10, armH + 5, 0, armH + 15); ctx.stroke(); } } 
                else if (this.isDrill || this.drillTimer > 0) { 
                    ctx.beginPath(); ctx.roundRect(-4, -4, 8, armH, 4); ctx.fill(); 
                    ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.moveTo(-6, armH); ctx.lineTo(6, armH); ctx.lineTo(0, armH + 25); ctx.fill(); 
                    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-4, armH+5); ctx.lineTo(4, armH+10); ctx.stroke();
                }
                else if (this.isRemote) { 
                    ctx.beginPath(); ctx.roundRect(-4, -4, 8, armH, 4); ctx.fill(); 
                    ctx.fillStyle = "#1e293b"; ctx.fillRect(-3, armH - 4, 6, 8); ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(0, armH, 2, 0, Math.PI*2); ctx.fill(); 
                }
                else if (this.isPainter) {
                    ctx.beginPath(); ctx.roundRect(-4, -4, 8, armH, 4); ctx.fill();
                    ctx.fillStyle = "#888"; ctx.fillRect(-2, armH, 4, 10); ctx.fillStyle = "#f00"; ctx.beginPath(); ctx.arc(0, armH+10, 3, 0, Math.PI*2); ctx.fill();
                }
                else if (this.isTurtle) { /* 腕は見えない */ }
                else if (this.isError) { ctx.fillRect(-4, -4, 8, armH); ctx.fillStyle="#0f0"; ctx.fillRect(-2, armH-4, 4, 4); }
                else { ctx.beginPath(); ctx.roundRect(-4, -4, 8, armH, 4); ctx.fill(); }
                ctx.restore();

                if (this.isPhantom || this.isGhost_p || this.isShadow) ctx.globalAlpha = 1.0;

                if (state === 'attack') {
                    if (this.isStriker) { ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; ctx.beginPath(); ctx.ellipse(35, headY + 10, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "rgba(59, 130, 246, 0.5)"; ctx.beginPath(); ctx.ellipse(45, headY + 10, 8, 16, 0, 0, Math.PI * 2); ctx.fill(); } 
                    else if (this.isNinja) { ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(10, headY, 35, -Math.PI * 0.7, 0.2); ctx.stroke(); ctx.strokeStyle = this.color; ctx.lineWidth = 12; ctx.stroke(); } 
                    else if (this.isBlade) { ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(15, headY, 50, -Math.PI * 0.8, 0.3); ctx.stroke(); ctx.strokeStyle = this.color; ctx.lineWidth = 16; ctx.stroke(); } 
                    else if (this.isGrappler) { ctx.strokeStyle = "rgba(249, 115, 22, 0.7)"; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(25, headY + 15, 20, -Math.PI*0.4, Math.PI*0.4); ctx.stroke(); } 
                    else if (this.isPink || this.isCommand) { ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; ctx.beginPath(); if (keys[this.controls.up]) { ctx.ellipse(0, headY - 20, 8, 15, 0, 0, Math.PI * 2); } else if (keys[this.controls.down] && !this.isCommand) { ctx.ellipse(0, headY + 40, 8, 15, 0, 0, Math.PI * 2); } else { ctx.ellipse(30, headY + 10, 15, 8, 0, 0, Math.PI * 2); } ctx.fill(); }
                    else if (this.isWind) { ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, headY); ctx.quadraticCurveTo(40, headY-10, 60, headY); ctx.moveTo(20, headY+10); ctx.quadraticCurveTo(40, headY+20, 60, headY+10); ctx.stroke(); }
                    else if (this.isBattery) { ctx.strokeStyle = "rgba(253, 224, 71, 0.8)"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(20, headY+10); ctx.lineTo(70, headY+10); ctx.stroke(); }
                    else if (this.isPulse || this.isVoid) { ctx.strokeStyle = this.isPulse ? "rgba(244, 114, 182, 0.5)" : "rgba(49, 46, 129, 0.8)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, headY+10, 40, 0, Math.PI*2); ctx.stroke(); }
                    else if (this.isGravity || this.isQuake || this.isAcid) { ctx.strokeStyle = this.color; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, headY+30); ctx.lineTo(0, headY+60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-10, headY+50); ctx.lineTo(0, headY+60); ctx.lineTo(10, headY+50); ctx.stroke(); }
                    else if (this.isEvo_slim) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.moveTo(10, headY+10); ctx.quadraticCurveTo(30, headY, 50, headY+15); ctx.lineTo(30, headY+20); ctx.fill(); }
                }
            }

            draw() {
                if (this.respawnTimer > 0) return; ctx.save();
                
                if (this.invTimer > 0 && Math.floor(frameCount / 5) % 2 === 0) { ctx.globalAlpha = 0.4; }

                if (this.buriedTimer > 0) ctx.translate(0, this.h / 2);

                const uHidden = this.uiThiefTimer > 0;
                ctx.fillStyle = "#fff"; ctx.font = "bold 14px Inter"; ctx.textAlign = "center";
                ctx.fillText(uHidden ? "???" : this.name, this.x + this.w / 2, this.y - 12);

                if (this.vampireCurseTimer > 0) {
                    ctx.fillStyle = "rgba(153, 27, 27, 0.4)";
                    ctx.beginPath(); ctx.ellipse(this.x + this.w/2, this.y + this.h/2, this.w, this.h, 0, 0, Math.PI*2); ctx.fill();
                }

                if (this.isDancer && this.hasDancerBarrier) {
                    ctx.strokeStyle = "rgba(244, 114, 182, 0.8)"; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.arc(this.x + this.w/2, this.y + this.h/2, this.h * 0.8, 0, Math.PI*2); ctx.stroke();
                }

                if (this.isStriker) {
                    if (this.shieldActive > 0) { ctx.fillStyle = "rgba(59, 130, 246, 0.7)"; if (this.dir === 1) ctx.fillRect(this.x + this.w, this.y - 5, 10, this.h + 10); else ctx.fillRect(this.x - 10, this.y - 5, 10, this.h + 10); }
                    else if (this.shieldTimer > 0) { ctx.fillStyle = "rgba(59, 130, 246, 0.3)"; if (this.dir === 1) ctx.fillRect(this.x + this.w, this.y + 10, 5, this.h - 20); else ctx.fillRect(this.x - 5, this.y + 10, 5, this.h - 20); }
                }

                if (this.dashTimer > 0) { ctx.fillStyle = this.color; ctx.globalAlpha = 0.3; ctx.fillRect(this.x - (this.dir*20), this.y, this.w, this.h); ctx.globalAlpha=1.0; const target = players.find(p => p.id !== this.id); if (target.x < this.x + this.w && target.x + target.w > this.x && target.y < this.y + this.h && target.y + target.h > this.y) { this.hit(target, this.isTurtle?10:(this.isIce_run?8:30), this.isTurtle?0.5:1.8); this.dashTimer = 0; } }

                ctx.shadowBlur = 10; ctx.shadowColor = this.color;
                if (this.charge > 0 || this.batteryCharge > 0) { ctx.strokeStyle = "#fff"; ctx.strokeRect(this.x - 4, this.y - 4, this.w + 8, this.h + 8); ctx.fillStyle = "#fff"; ctx.fillRect(this.x, this.y + this.h + 5, this.w * ((this.charge || this.batteryCharge)/100), 4); }
                if (this.mirrorTimer > 0) { ctx.strokeStyle = "#06b6d4"; ctx.lineWidth = 3; ctx.strokeRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10); }

                if (this.isIllusion && this.history.length > 30) {
                    const p1 = this.history[Math.max(0, this.history.length - 15)]; const p2 = this.history[Math.max(0, this.history.length - 30)];
                    if (p1) { ctx.save(); ctx.globalAlpha = 0.3; ctx.translate(p1.x + this.w/2, p1.y + this.h); if (this.dir===-1) ctx.scale(-1,1); this.drawSprite(ctx); ctx.restore(); }
                    if (p2) { ctx.save(); ctx.globalAlpha = 0.3; ctx.translate(p2.x + this.w/2, p2.y + this.h); if (this.dir===-1) ctx.scale(-1,1); this.drawSprite(ctx); ctx.restore(); }
                }

                ctx.translate(this.x + this.w / 2, this.y + this.h); if (this.dir === -1) ctx.scale(-1, 1);
                this.drawSprite(ctx); ctx.restore();

                const m = 20;
                if (this.x < -m || this.x > canvas.width + m || this.y < -m || this.y > canvas.height + m) {
                    if (this.y < canvas.height + 150) {
                        let ix = Math.max(m+10, Math.min(canvas.width - m-10, this.x + this.w/2)); let iy = Math.max(m+10, Math.min(canvas.height - m-10, this.y + this.h/2));
                        ctx.save(); ctx.beginPath(); ctx.arc(ix, iy, 20, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
                        ctx.fillStyle = "#fff"; ctx.font = "bold 12px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(uHidden?"???":this.name.substring(0, 2).toUpperCase(), ix, iy);
                        ctx.translate(ix, iy); ctx.rotate(Math.atan2(this.y + this.h/2 - iy, this.x + this.w/2 - ix)); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(22, -8); ctx.lineTo(32, 0); ctx.lineTo(22, 8); ctx.fill(); ctx.restore();
                    }
                }
            }
        }
