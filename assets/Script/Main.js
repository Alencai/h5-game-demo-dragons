var Class_Dragon = require("Player");

cc.Class({
    extends: cc.Component,

    properties: {
        //c_DragonAtlas: { default: null, type: cc.SpriteAtlas}, 
        c_btnOnline: {default: null, type: cc.Node},
        c_btnOffline: {default: null, type: cc.Node},
        c_txtNum: {default: null, type: cc.Label},
        c_btnAttack: {default: null, type: cc.Node},
        c_keyTouch: {default: null, type: cc.Node},
        c_keyBoard: {default: null, type: cc.Node},
        c_keyCenter: {default: null, type: cc.Node},
    },

    // use this for initialization
    onLoad: function () {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.c_keyTouch.on(cc.Node.EventType.TOUCH_START, this.evtKeyTouchStart.bind(this));
        this.c_keyTouch.on(cc.Node.EventType.TOUCH_MOVE, this.evtKeyToucMove.bind(this));
        this.c_keyTouch.on(cc.Node.EventType.TOUCH_END, this.evtKeyToucEnd.bind(this));
        this.c_keyTouch.on(cc.Node.EventType.TOUCH_CANCEL, this.evtKeyToucEnd.bind(this));
        this.c_btnOnline.active = true;
        this.c_btnOffline.active = false;
        this.c_keyBoard.opacity = 50;
    },

    start: function () {
    },

    initData: function() {
        if (this._arrDragon) {
            for (var idx in this._arrDragon) {
                this._arrDragon[idx].node.removeFromParent();
            }
        }
        if (this._arrDie) {
            for (var idx in this._arrDie) {
                this._arrDie[idx].node.removeFromParent();
            }
        }
        if (this._arrDie) {
            for (var idx in this._arrFood) {
                this._arrFood[idx].node.removeFromParent();
            }
        }
        // 同步
        this._randF1 = 1;
        this._randF2 = 1;
        this._arrDragon = [];
        this._arrFood = [];
        this._curFrame = 0;
        // 非同步
        this._arrDie = [];
        this._iLocalOpt = 0;
        this._iTimeStep = 0;
        this._curNum = 0;
    },

    // called every frame
    update: function (dt) {
        if (this.m_Socket) {
            ++ this._iTimeStep;
            if (this._iTimeStep >= Macro.FRAME_SPEED) {
                this._iTimeStep = 0;
                for (var idx in this._arrDragon){
                    this._arrDragon[idx].updateFrame();
                }
                var arrDie = this._arrDie;
                for (var idx = 0; idx < arrDie.length;) {
                    if (arrDie[idx].waitRemove) {
                        arrDie[idx].node.removeFromParent();
                        arrDie.splice(idx, 1);
                        continue;
                    }
                    arrDie[idx].updateFrame();
                    ++idx;
                }
                for (var idx in this._arrFood){
                    var food = this._arrFood[idx];
                    if(food.opt > 0) {
                        if (!food.node) {
                            var foodNode = new cc.Node();
                            foodNode.color = food.color;
                            foodNode.x = food.x;
                            foodNode.y = food.y;
                            this.node.addChild(foodNode);
                            var foodSp = foodNode.addComponent(cc.Sprite);
                            cc.loader.loadRes('key_center', cc.SpriteFrame, function (err, spriteFrame) {
                                foodSp.spriteFrame = spriteFrame;
                                foodNode.width = Macro.FOODDIS;
                                foodNode.height = Macro.FOODDIS;
                            });
                            food.node = foodNode;
                        }
                    }
                    else {
                        if (food.node) {
                            food.node.removeFromParent();
                            food.node = null;
                        }
                    }
                }
            }
            this.c_txtNum.string = "当前在线：" + this._curNum;
        }
        else {
            this.c_txtNum.string = "未连接服务器";
        }
    },

    initRandFirst: function(seed) {
        var mod = Macro.RAND_MOD;
        var f1, f2, f3, f4;
        var s1 = 0, s2 = 1, s3 = 1, s4 = 1;
        var a1 = 0, a2 = 1, a3 = 1, a4 = 1;
        while(seed && seed >= 1) {
            if (seed & 1) {
                f1 = s1 * a1 + s2 * a3;
                f2 = s1 * a2 + s2 * a4;
                f3 = s3 * a1 + s4 * a3;
                f4 = s3 * a2 + s4 * a4;
                s1 = f1 % mod;
                s2 = f2 % mod;
                s3 = f3 % mod;
                s4 = f4 % mod;
            }
            f1 = a1 * a1 + a2 * a3;
            f2 = a1 * a2 + a2 * a4;
            f3 = a3 * a1 + a4 * a3;
            f4 = a3 * a2 + a4 * a4;
            a1 = f1 % mod;
            a2 = f2 % mod;
            a3 = f3 % mod;
            a4 = f4 % mod;
            seed >>= 1;
        }       
        this._randF1 = (s1 + s2) % mod;
        this._randF2 = (s3 + s4) % mod;
    },

    getRand: function() {
        var mod = Macro.RAND_MOD;
        var tmp = this._randF1;
        this._randF1 = this._randF2;
        this._randF2 = (tmp + this._randF2) % mod
        return tmp;
    },

    randFood: function() {
        var arrFood = this._arrFood;
        for (var idx = 0; idx < arrFood.length;){
            var food = this._arrFood[idx];
            if(food.opt == 0 && !food.node) {
                arrFood.splice(idx, 1);
                continue;
            }
            ++idx;
        }
        if (arrFood.length > 0) {
            return;
        }                    
        var food = {};
        var width = 640 - 80;
        var height = 640 - 80;
        food.x = this.getRand() * this.getRand() % width - width / 2;
        food.y = this.getRand() * this.getRand() % height - height / 2;
        var randOpt = this.getRand();
        if (randOpt & 1) {
            food.color = new cc.Color(150, 255, 150);
            food.opt = 1;
        }
        else {
            food.color = new cc.Color(255, 150, 150);
            food.opt = 2;
        }
        food.node = null;
        arrFood.push(food);
    },

    runFrame: function(data) {
        if (!data || !data.frame || this._curFrame >= data.frame) {
            cc.log('Error1', data);
            return
        }
        var arrDragon = this._arrDragon;
        var arrDie = this._arrDie;
        ++ this._curFrame;
        while(this._curFrame < data.frame) {
            this.randFood();
            for (var idx in arrDragon){
                arrDragon[idx].eatFood(this._arrFood);
                arrDragon[idx].updateAction();
            }
            for (var idx in arrDragon){
                arrDragon[idx].checkDie();
            }
            ++ this._curFrame;
        }
        if (data.opts) {
            for (var idxOpt in data.opts) {
                var opt = data.opts[idxOpt];
                if (opt.uin) {
                    var find = false;
                    for (var idxDragon in arrDragon){
                        var dragon = arrDragon[idxDragon];
                        if (opt.uin == dragon.uin) {
                            dragon.opt = opt.opt;
                            find = true;
                            break;
                        }
                    }
                    if (!find) {
                        var dragon = new Class_Dragon();
                        dragon.allPlayers = arrDragon;
                        dragon.allDies = arrDie;
                        dragon.uin = opt.uin;
                        dragon.opt = opt.opt;
                        this.node.addChild(dragon.node);
                        arrDragon.push(dragon);
                    }
                }
            }
        }
        this.randFood();
        for (var idx in arrDragon){
            arrDragon[idx].eatFood(this._arrFood);
            arrDragon[idx].updateAction();
        }
        for (var idx = 0; idx < arrDragon.length;){
            var dragon = arrDragon[idx];
            var isDie = dragon.checkDie();
            dragon.updateStatus();
            if (isDie) {
                arrDie.push(dragon);
                arrDragon.splice(idx, 1);
                continue;
            }
            ++ idx;
        }
    },

    evtOnline: function() {
        this.c_btnOnline.active = false;
        if (!this.m_Socket) {
            this.initData();
            this.initSocekt();
        }
    },

    evtOffline: function() {
        this.c_btnOffline.active = false;
        if (this.m_Socket) {
            this.initData();
            this.m_Socket.close();
        }
    },

    //======================================================================================================

    //--------------------keyboard-------------------------------begin

    onKeyUp: function(evt) {
        var iLast = this._iLocalOpt;
        switch(evt.keyCode) {    
            case cc.KEY.w: this._iLocalOpt &= ~Macro.KEY_UP; break;
            case cc.KEY.s: this._iLocalOpt &= ~Macro.KEY_DOWN; break;
            case cc.KEY.d: this._iLocalOpt &= ~Macro.KEY_RIGHT; break;
            case cc.KEY.a: this._iLocalOpt &= ~Macro.KEY_LEFt; break;
            case cc.KEY.space: this._iLocalOpt &= ~Macro.KEY_ATTACK; break;
        }
        if (this.m_Socket && iLast != this._iLocalOpt) {
            this.m_Socket.send('' +  this._iLocalOpt);
        }
    },

    onKeyDown: function(evt) {
        var iLast = this._iLocalOpt;
        switch(evt.keyCode) {    
            case cc.KEY.w: this._iLocalOpt |= Macro.KEY_UP; break;
            case cc.KEY.s: this._iLocalOpt |= Macro.KEY_DOWN; break;
            case cc.KEY.d: this._iLocalOpt |= Macro.KEY_RIGHT; break;
            case cc.KEY.a: this._iLocalOpt |= Macro.KEY_LEFt; break;
            case cc.KEY.space: this._iLocalOpt |= Macro.KEY_ATTACK; break;
        }
        if (this.m_Socket && iLast != this._iLocalOpt) {
            this.m_Socket.send('' +  this._iLocalOpt);
        }
    },

    evtKeyTouchStart: function(evt) {
        if (!this._iOldKeyBoardX) {
            this._iOldKeyBoardX = this.c_keyBoard.x;
            this._iOldKeyBoardY = this.c_keyBoard.y;
        }
        var startPos = evt.getStartLocation();
        this.c_keyBoard.x = Math.max(this._iOldKeyBoardX, startPos.x - this.node.width / 2);
        this.c_keyBoard.y = Math.max(this._iOldKeyBoardY, startPos.y - this.node.height / 2);
        this.c_keyBoard.opacity = 150;
    },
    
    evtKeyToucMove: function(evt) {
        var endPos = evt.getLocation();
        var startPos = evt.getStartLocation();
        var disX = endPos.x - startPos.x;
        var disY = endPos.y - startPos.y;
        var disS = Math.sqrt(disX * disX + disY * disY);
        if (disS > 60) {
            disX *= 60 / disS;
            disY *= 60 / disS;
        }
        this.c_keyCenter.x = disX;
        this.c_keyCenter.y = disY;

        //------------ 键位--------------
        var iLast = this._iLocalOpt;
        var fAngle = Math.atan(disX / disY) * 180 / Math.PI;
        if (disX > 10) {
            if (fAngle < -30 || 30 <= fAngle) {
                this._iLocalOpt |= Macro.KEY_RIGHT;
            }
            else {
                this._iLocalOpt &= ~Macro.KEY_RIGHT;
            }
            this._iLocalOpt &= ~Macro.KEY_LEFt;
        }
        else if(disX < -10) {
            this._iLocalOpt &= ~Macro.KEY_RIGHT;
            if (fAngle < -30 || 30 <= fAngle) {
                this._iLocalOpt |= Macro.KEY_LEFt;
            }
            else {
                this._iLocalOpt &= ~Macro.KEY_LEFt;
            }
        } 
        if (disY > 10) {
            if (-60 <= fAngle && fAngle < 60) {
                this._iLocalOpt |= Macro.KEY_UP;
            }
            else {
                this._iLocalOpt &= ~Macro.KEY_UP;
            }
            this._iLocalOpt &= ~Macro.KEY_DOWN;
        }
        else if(disY < -10) {
            this._iLocalOpt &= ~Macro.KEY_UP;
            if (-60 <= fAngle && fAngle < 60) {
                this._iLocalOpt |= Macro.KEY_DOWN;
            }
            else {
                this._iLocalOpt &= ~Macro.KEY_DOWN;
            }
        } 
        if (this.m_Socket && iLast != this._iLocalOpt) {
            this.m_Socket.send('' +  this._iLocalOpt);
        }
    },

    evtKeyToucEnd: function(evt) {
        this.c_keyBoard.opacity = 50;
        this.c_keyCenter.x = 0;
        this.c_keyCenter.y = 0;
        this.c_keyBoard.x = this._iOldKeyBoardX;
        this.c_keyBoard.y = this._iOldKeyBoardY;

        //------------ 键位--------------
        var iLast = this._iLocalOpt;
        this._iLocalOpt &= ~Macro.KEY_UP;
        this._iLocalOpt &= ~Macro.KEY_DOWN;
        this._iLocalOpt &= ~Macro.KEY_RIGHT;
        this._iLocalOpt &= ~Macro.KEY_LEFt;
        if (this.m_Socket && iLast != this._iLocalOpt) {
            this.m_Socket.send('' +  this._iLocalOpt);
        }
    },

    evtBtnAttackDown: function(evt) {
        var iLast = this._iLocalOpt;
        this._iLocalOpt |= Macro.KEY_ATTACK;
        if (this.m_Socket && iLast != this._iLocalOpt) {
            this.m_Socket.send('' +  this._iLocalOpt);
        }
        // 攻击按钮自动松开
        this.c_btnAttack.stopAllActions();
        this.c_btnAttack.runAction(cc.sequence(
            cc.delayTime(0.1),
            cc.callFunc(this.evtBtnAttackUp, this)
        ));
    },

    evtBtnAttackUp: function(evt) {
        var iLast = this._iLocalOpt;
        this._iLocalOpt &= ~Macro.KEY_ATTACK;
        if (this.m_Socket && iLast != this._iLocalOpt) {
            this.m_Socket.send('' +  this._iLocalOpt);
        }
    },

    //--------------------keyboard-------------------------------end

    //======================================================================================================

    //--------------------socket-------------------------------begin

    initSocekt: function() {
        this.m_Socket = null;
        var ws = new WebSocket(Macro.SERVER);
        ws.onmessage = this.onSocketMessage.bind(this);
        ws.onopen =  this.onSocektOpen.bind(this);
        ws.onclose = this.onSocketClose.bind(this);
        ws.onerror = this.onSocketErr.bind(this);
    },

    onSocketMessage: function(evt) {
        if (!evt || !evt.data) {
            return;
        }
        var data = JSON.parse(evt.data); 
        if (!data) {
            return;
        }
        if (data.id == 2) {
            this._curNum = data.count || this._curNum;
            this.runFrame(data);
            return;
        }
        if (data.id == 1) {
            this.initRandFirst(data.seed);
            this._curNum = data.count || this._curNum;
            if (data.historys) {
                for (var idx in data.historys) {
                    this.runFrame(data.historys[idx]);
                }
                var arrDragon = this._arrDragon;
                for (var idx = 0; idx < arrDragon.length;) {
                    if (arrDragon[idx].isDie()) {
                        arrDragon[idx].node.removeFromParent();
                        arrDragon.splice(idx, 1);
                        continue;
                    }
                    ++idx;
                }
            }
            return;
        }
    },

    onSocektOpen: function(evt) {
        this.m_Socket = evt.target;
        this.c_btnOnline.active = false;
        this.c_btnOffline.active = true;
        cc.log("onOpenSocekt");
    },

    onSocketClose: function(evt) {
        this.m_Socket = null;
        this.c_btnOnline.active = true;
        this.c_btnOffline.active = false;
        cc.log("onSocketClose");
    },

    onSocketErr: function(evt) {
        this.m_Socket = null;
        this.c_btnOnline.active = true;
        this.c_btnOffline.active = false;
        cc.log("onSocketErr");
        cc.log(evt);
    },

    //--------------------socket-------------------------------end

});
