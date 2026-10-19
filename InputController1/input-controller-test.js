//кнопки
var defaultActions = {
    left: {
        keys : [37,65],
        enabled: true
    },
    right: {
        keys: [39,68],
        enabled: true  
    },
    up: {
        keys: [38,87],
        enabled: true
    },
    down:{
        keys: [40,83],
        enabled: true
    }
};

//элементы страницы

var targetElement = document.getElementById("target-element");
var box = document.getElementById ("box");
var logList = document.getElementById("log-list");

//создаем контр и инициализируем
var controller = new InputController(defaultActions, targetElement);


//добавление записей в лог
function addlog(text){
    var item = document.createElement("li");
    item.textContent = text;
    logList.insertBefore(item, logList.firstChild);
}

//слушаем события контроллера на дом элементе
targetElement.addEventListener(controller.ACTION_ACTIVATED, function (e){
    addlog("активировано: " + e.detail.action);

    //прыжок = рыжый
    if (e.detail.action === "jump"){
        box.style.backgroundColor = "orange"
    }
});

targetElement.addEventListener(controller.ACTION_DEACTIVATED, function (e){
    addlog("деактивировано: " + e.detail.action);

    //возвр цвет
    if (e.detail.action === "jump") {
        box.style.backgroundColor = "dodgerblue";
    }
});

//привязка кнопок
document.getElementById("btn-attach").onclick = function(){
    controller.attach(targetElement);
    targetElement.focus();
    addlog("вызван attach");
};

document.getElementById("btn-detach").onclick = function(){
    controller.detach(targetElement);
    addlog("вызван detach");
};

document.getElementById("btn-enable").onclick = function (){
    controller.enabled = true;
    addlog("контроллер включен (enabled = true)");
};

document.getElementById("btn-disable").onclick = function (){
    controller.enabled = false;
    addlog("контроллер включен (enabled = false)");
};

document.getElementById("btn-bind-jump").onclick = function(){
    controller.bindActions({
        jump: {
            keys: [32],
            enabled : true
        }
    });
    addlog("привязана активность прыжка на пробел!")
};

targetElement.focus();


//анимация
var posX = 175;
var posY = 100;
var speed = 3;

function gameLoop() {
    //horizont
  if (controller.isActionActive("left")) {
    posX -= speed;
  }
  if (controller.isActionActive("right")) {
    posX += speed;
  }

  //vertical
  if (controller.isActionActive("up")) {
    posY -= speed;
  }
  if (controller.isActionActive("down")) {
    posY += speed;
  }
  // ограничиваем перемещение внутри рамки
  if (posX < 0) posX = 0;
  if (posX > 350) posX = 350;

  if (posY < 0) posY = 0;
  if (posY > 200) posY = 200;

  box.style.left = posX + "px";
  box.style.top = posY + "px"

  // отображаем свойства контроллера на экране
  document.getElementById("val-enabled").textContent = controller.enabled;
  document.getElementById("val-focused").textContent = controller.focused;
  document.getElementById("val-left").textContent = controller.isActionActive("left");
  document.getElementById("val-right").textContent = controller.isActionActive("right");
  document.getElementById("val-jump").textContent = controller.isActionActive("jump");

  requestAnimationFrame(gameLoop);
}

// игровой цикл
requestAnimationFrame(gameLoop);