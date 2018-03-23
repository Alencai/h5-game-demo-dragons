cc.Class({
    properties: {
        //同步变量
        allPlayers: {
            set: function (value) { this._arrPlayers = value || []; },
        },
        allDies: {
            set: function (value) { this._arrDies = value || []; },
        },
        playerData: {
            get: function () { return this._playerData; },
        },
        node: {
            get: function () { 
                if (!this._node) {
                    this._node = new cc.Node();
                    this._node.scale = Macro.DRAGON_SCALE;
                    this._sprite = this._node.addComponent(cc.Sprite);

                    var circleNode = new cc.Node();
                    circleNode.color = new cc.Color(150, 255, 150); 
                    circleNode.opacity = 100;
                    this._node.addChild(circleNode);
                    var spCircle = circleNode.addComponent(cc.Sprite);
                    cc.loader.loadRes('key_center', cc.SpriteFrame, function (err, spriteFrame) {
                        spCircle.spriteFrame = spriteFrame;
                        circleNode.width = Macro.ATTACKDIS;
                        circleNode.height = Macro.ATTACKDIS;
                    });
                    this._spCircle = circleNode;

                    var nodeHp = new cc.Node();
                    nodeHp.x = -10;
                    nodeHp.y = 20;
                    nodeHp.color = new cc.Color(255, 50, 50); 
                    this._node.addChild(nodeHp);
                    this._labelHP = nodeHp.addComponent(cc.Label);
                    this._labelHP.string = '0';
                    this._labelHP.fontSize = 22;

                    var nodeAttack = new cc.Node();
                    nodeAttack.x = -10;
                    nodeAttack.y = -20;
                    nodeAttack.color = new cc.Color(100, 255, 100); 
                    this._node.addChild(nodeAttack);
                    this._labelAttack = nodeAttack.addComponent(cc.Label);
                    this._labelAttack.string = '0';
                    this._labelAttack.fontSize = 22;
                }
                return this._node; 
            },
            set: function (value) { this._node = value; },
        },
        opt: {
            get: function () { return this._optCur; },
            set: function (value) { this._optCur = value; },
        },
        uin: {
            get: function () { return this._uin; },
            set: function (value) { this._uin = value; },
        },
        waitRemove: {
            get: function () { return this._waitRemove; },
        },
    },

    ctor: function () {
        // 同步变量
        this._uin = 0;
        this._optCur = 0;
        this._arrPlayers = [];
        this._playerData = {
            x: 0,
            y: 0,
            iHpCur: 100,
            iAttackDamage: 10,
            iAttackFrame: -1,
            iTakingDamage: 0,
            iTakingFrame: -1,
        }
        // ui变量
        this._arrDies = [];
        this._faceCur = 1; 
        this._actionPre = 0;
        this._actionCur = 1;
        this._waitRemove = false;
        this.initFaceInfo();
        this.initActionInfo();
    },

    //-----------------------------------------------------------

    // 同步方法
    isDie: function() {
        return this._playerData.iHpCur <= 0;
    },

    // 同步方法
    eatFood: function(arrFood) {
        for(var idx in arrFood) {
            var food = arrFood[idx];
            if (food.opt == 0) {
                continue;
            }
            var disX = food.x - this._playerData.x;
            var disY = food.y - this._playerData.y;
            if (disX * disX + disY * disY < Macro.ATTACKDIS * Macro.ATTACKDIS) {
                if (food.opt == 1) {
                    this._playerData.iAttackDamage += 5;
                    food.opt = 0;
                    continue;
                }
                if (food.opt == 2) {
                    this._playerData.iHpCur += 10;
                    food.opt = 0;
                    continue;
                }
            }
        }
    },

    // 同步方法（外部），更新帧
    updateAction: function() {
        if (this.isDie()) {
            return;
        }
        // 受伤无法被打断
        if (this._playerData.iTakingFrame >= 0) {
            this._playerData.iTakingFrame -= 2;
            if (this._playerData.iTakingFrame > 0) {
                return
            }
            return;
        }
        // 移动
        var isMove = this.updateFace();
        if (this._playerData.x < -480) this._playerData.x = -480;
        if (this._playerData.x >  480) this._playerData.x =  480;
        if (this._playerData.y < -320) this._playerData.y = -320;
        if (this._playerData.y >  320) this._playerData.y =  320;
        // 攻击无法被打断
        if (this._playerData.iAttackFrame >= 0) {
            this._playerData.iAttackFrame -= 2;
            if (this._playerData.iAttackFrame > 0) {
                // 攻击动作到一半时产生伤害
                if (this._playerData.iAttackFrame == parseInt(8 * Macro.FRAME_SPEED / 4)) {
                    for (var idx in this._arrPlayers) {
                        this._arrPlayers[idx].takingDamage(this);
                    }
                }
                return
            }
        }
        // 攻击
        if (this._optCur & Macro.KEY_ATTACK) {
            this._playerData.iAttackFrame = 20 * Macro.FRAME_SPEED / 4;
            this._actionCur = Macro.ACTION_ATTACK;
            return;
        }
        // 默认动作
        this._actionCur = isMove ? Macro.ACTION_WALK : Macro.ACTION_STAY;
    },

    // 同步方法（外部），更新死亡
    checkDie: function() {
        if (this._playerData.iTakingDamage <= 0) {
            return false;
        }
        this._playerData.iHpCur -= this._playerData.iTakingDamage;
        this._playerData.iTakingDamage = 0;
        if (this._playerData.iHpCur <= 0) {     
            // 死亡
            this._actionCur = Macro.ACTION_DYE;
            return true;
        }
        // 受伤
        this._playerData.iTakingFrame = 20 * Macro.FRAME_SPEED / 4;
        this._actionCur = Macro.ACTION_TAKEDAMAGE;
        return false;
    },

    // 同步方法（内部），受到攻击
    takingDamage: function(other) {
        if (this.isDie()) {
            return;
        }
        if (!other || !other.node || other.uin == this._uin) {
            return;
        }
        var disX = other.playerData.x - this._playerData.x;
        var disY = other.playerData.y - this._playerData.y;
        if (disX * disX + disY * disY < Macro.ATTACKDIS * Macro.ATTACKDIS) {
            this._playerData.iTakingDamage += other.playerData.iAttackDamage;
        }
    },

    // 同步方法（内部），朝向和行走
    updateFace: function () {
        var iOpt = this._optCur;
        if (iOpt & 1) {
            if (iOpt & 4) {
                this._playerData.x += Macro.MOVE_XY;
                this._playerData.y += Macro.MOVE_XY;
                this._faceCur = 7;
                return true;
            }
            if (iOpt & 8) {
                this._playerData.x -= Macro.MOVE_XY;
                this._playerData.y += Macro.MOVE_XY;
                this._faceCur = 8;
                return true;
            }
            this._playerData.y += Macro.MOVE_DX;
            this._faceCur = 4;
            return true;
        }
        if (iOpt & 2) {
            if (iOpt & 4) {
                this._playerData.x += Macro.MOVE_XY;
                this._playerData.y -= Macro.MOVE_XY;
                this._faceCur = 5;
                return true;
            }
            if (iOpt & 8) {
                this._playerData.x -= Macro.MOVE_XY;
                this._playerData.y -= Macro.MOVE_XY;
                this._faceCur = 6;
                return true;
            }
            this._playerData.y -= Macro.MOVE_DX;
            this._faceCur = 3;
            return true;
        }
        if (iOpt & 4) {
            this._faceCur = 1;
            this._playerData.x += Macro.MOVE_DX;
            return true;
        }
        if (iOpt & 8) {
            this._faceCur = 2;
            this._playerData.x -= Macro.MOVE_DX;
            return true;
        }
        return false;
    },
    
    //-----------------------------------------------------------


    // ui方法（外部），更新状态
    updateStatus: function() {
        this.initFaceInfo();
        this.initActionInfo();
    },

    // ui方法
    updateFrame: function() {
        // 位置
        if (this._node) {
            this._node.x = this._playerData.x;
            this._node.y = this._playerData.y;
        }

        // 数值
        if (this._labelHP && this._labelAttack) {
            this._labelHP.string = '' + this._playerData.iHpCur;
            this._labelAttack.string = '' + this._playerData.iAttackDamage;
        }

        // 攻击圈圈
        this._spCircle.active = this._actionCur == Macro.ACTION_ATTACK;

        // 图片
        var sp = this._sprite;
        if (sp) {
            var path = 'Wyvern/' + this._actionName + '/OrcWyvern_' + this._actionName + '_' + this._faceName + (this._actionCurFrame < 10 ? '000' : '00') + this._actionCurFrame;
            cc.loader.loadRes(path, cc.SpriteFrame, function (err, spriteFrame) {
                sp.spriteFrame = spriteFrame;
            });
            this._actionCurFrame += 2;
            if (this._actionCurFrame > this._actionFrame) {
                this._actionCurFrame = 0;
                if (this._actionCur == Macro.ACTION_DYE) { 
                    this._waitRemove = true;
                    return;
                }
            }
        }
    },

    // ui方法（内部），更新朝向名称
    initFaceInfo: function() {
        switch(this._faceCur) {
            case 1: this._faceName = 'E'; break;
            case 2: this._faceName = 'W'; break;
            case 3: this._faceName = 'S'; break;
            case 4: this._faceName = 'N'; break;
            case 5: this._faceName = 'SE'; break;
            case 6: this._faceName = 'SW'; break;
            case 7: this._faceName = 'NE'; break;
            case 8: this._faceName = 'NW'; break;
            default: this._faceName = 'E';
        }
    },

    // ui方法（内部），更新动作数据
    initActionInfo: function() {
        if (this._actionPre == this._actionCur) {
            return;
        }
        this._actionPre = this._actionCur;
        this._actionCurFrame = 0;
        switch (this._actionCur) {
            case Macro.ACTION_STAY: this._actionFrame = 30; this._actionName = 'Staying'; break;
            case Macro.ACTION_WALK: this._actionFrame = 30; this._actionName = 'Walking'; break;
            case Macro.ACTION_ATTACK: this._actionFrame = 20; this._actionName = 'Attacking'; break;
            case Macro.ACTION_DYE: this._actionFrame = 30; this._actionName = 'Dying'; break;
            case Macro.ACTION_TAKEDAMAGE: this._actionFrame = 20; this._actionName = 'TakingDamage'; break;
            default : this._actionFrame = 20; this._actionName = 'Attacking';
        }
    },
});
