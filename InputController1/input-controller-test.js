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
controller.use(new MousePlugin());
controller.use(new KeyboardPlugin());


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
    addlog("контроллер выключен (enabled = false)");
};

document.getElementById("btn-bind-jump").onclick = function(){
    controller.bindActions({
        jump: {
            keys: [32],
            buttons : [0],
            enabled : true
            
        }
    });
    addlog("привязана активность прыжка")
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

var ballElement = document.getElementById("ball");
var isBallJumping = false;

//трансформация
gsap.set(ballElement,{ transformOrigin: "50% 100&%"});

function playJumpAnimation(){
    if(isBallJumping) return;
    isBallJumping = true;

    var tl = gsap.timeline({
        onComplete: function(){
            isBallJumping = false; //новый джам после полн остановки
        }
    });
 
    //отскок
    tl.to(ballElement, {scaleX: 1, scaleY: 1, duration: 0.08, ease: "power1.in"})
    //взлет
    .to(ballElement, {y: -130, scaleX: 0.7, scaleY: 1.4, duration: 0.35, ease: "power2.out"})
    //пик
    .to(ballElement, { scaleX: 1, scaleY: 1, duration: 0.08 }, "-=0.08")
    //падение
    .to(ballElement, {y: 0, scaleX: 0.75,scaleY: 1.35, duration: 0.28, ease: "power2.in"})
    //удар о платформу
    .to(ballElement, {scaleX: 1.45, scaleY: 0.55, duration: 0.08, ease: "power1.out" })

    //отскок 2
    .to(ballElement, { y: -45, scaleX: 0.85, scaleY: 1.15, duration: 0.22, ease: "power2.out" })
    .to(ballElement, { scaleX: 1, scaleY: 1, duration: 0.06 }, "-=0.06")
    .to(ballElement, { y: 0, scaleX: 0.9, scaleY: 1.1, duration: 0.18, ease: "power2.in" })
    .to(ballElement, { scaleX: 1.2, scaleY: 0.8, duration: 0.06, ease: "power1.out" })

    //отскок 3
    .to(ballElement, { y: -12, scaleX: 0.95, scaleY: 1.05, duration: 0.12, ease: "power2.out" })
    .to(ballElement, { y: 0, scaleX: 1, scaleY: 1, duration: 0.12, ease: "power2.in" })

    //финал анимации
    .to(ballElement, { scaleX: 1.05, scaleY: 0.95, duration: 0.05 })
    .to(ballElement, { scaleX: 1, scaleY: 1, duration: 0.05 });
}

//запуск анимации
targetElement.addEventListener(controller.ACTION_ACTIVATED, function (e){
    addlog("активировано : " + e.detail.action);

    if(e.detail.action === "jump"){
        box.style.backgroundColor = "orange";
        playJumpAnimation(); //запуск
    }
});
// игровой цикл
requestAnimationFrame(gameLoop);