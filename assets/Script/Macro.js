var _Macro = window.Macro = new Object();

//_Macro.SERVER = "ws://182.61.30.243:16736/"; //服务器
//_Macro.SERVER = "ws://10.0.1.218:16736/"; //局域网
_Macro.SERVER = "ws://localhost:16736/"; //本机

_Macro.KEY_UP = 1;
_Macro.KEY_DOWN = 2;
_Macro.KEY_RIGHT = 4;
_Macro.KEY_LEFt = 8;
_Macro.KEY_ATTACK = 16;

_Macro.ACTION_STAY = 1;
_Macro.ACTION_WALK = 2;
_Macro.ACTION_ATTACK = 3;
_Macro.ACTION_DYE = 4;
_Macro.ACTION_TAKEDAMAGE = 5;

_Macro.FRAME_SPEED = 2;
_Macro.DRAGON_SCALE = 1.5;
_Macro.RAND_MOD = 25536;
_Macro.ATTACKDIS = 80 * _Macro.DRAGON_SCALE;
_Macro.FOODDIS = 40;
_Macro.MOVE_XY = 7;
_Macro.MOVE_DX = Math.sqrt(_Macro.MOVE_XY * _Macro.MOVE_XY * 2);


