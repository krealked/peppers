(function(){
    //плагин ввод с клавиатуры
    class KeyboardPlugin {
        constructor(){
            this.pressedKeys = [];
            this.target = null;
            this.onUpdate = null; //колбек при изм ввода

            this.onKeyDown = this.handleKeyDown.bind(this);
            this.onKeyUp = this.handleKeyUp.bind(this);
            this.onWindowBlur = this.handleBlur.bind(this);
        }

        init(onUpdateCallback){
            this.onUpdate = onUpdateCallback;
            window.addEventListener("blur", this.onWindowBlur);
        }

        attach(target){
            this.target = target;
            this.target.addEventListener("keydown", this.onKeyDown);
            this.target.addEventListener("keyup", this.onKeyUp);
        }

        detach(){
            if (this.target){
                this.target.removeEventListener("keydown", this.onKeyDown);
                this.target.removeEventListener("keyup", this.onKeyUp);
                this.target = null;
            }
            this.reset();
        }

        reset(){
            this.pressedKeys = [];
        }

        handleKeyDown(event){
            if(event.repeat) return;
            let code = event.keyCode || event.which;

            if (this.pressedKeys.indexOf(code) === -1){
                this.pressedKeys.push(code);
            }
            if (this.onUpdate) this.onUpdate();
        }

        handleKeyUp(event){
            let code = event.keyCode || event.which;
            let index = this.pressedKeys.indexOf(code);

            if (index !== -1){
                this.pressedKeys.splice(index, 1);
            }
            if (this.onUpdate) this.onUpdate();
        }

        handleBlur(){
            this.reset();
            if (this.onUpdate) this.onUpdate();
        }

        //проверка параметра для экшена
        isActionActive(actionConfig){
            if(!actionConfig || !actionConfig.keys) return false;

            for(let i = 0; i < actionConfig.keys.length; i++){
                if(this.pressedKeys.indexOf(actionConfig.keys[i]) !== -1){
                    return true;
                }
            }
            return false;
        }
        //проверка обратной совместимости
        isKeyPressed(keyCode){
            return this.pressedKeys.indexOf(Number(keyCode)) !== -1;
        }
    }
    // плагин ввод с мыши
    class MousePlugin {
        constructor(){
            this.pressedButtons = [];
            this.target = null;
            this.onUpdate = null;

            this.onMouseDown = this.handleMouseDown.bind(this);
            this.onMouseUp = this.handleMouseUp.bind(this);
            this.onContextMenu = this.handleContextMenu.bind(this);
            this.onWindowBlur = this.handleBlur.bind(this);
        }

        init(onUpdateCallback){
            this.onUpdate = onUpdateCallback;
            window.addEventListener("blur", this.onWindowBlur);
        }

        attach(target){
            this.target = target;
            this.target.addEventListener("mousedown", this.onMouseDown);
            this.target.addEventListener("mouseup", this.onMouseUp);
            this.target.addEventListener("contextmenu", this.onContextMenu);
        }

        detach(){
            if(this.target){
                this.target.removeEventListener("mousedown", this.onMouseDown);
                this.target.removeEventListener("mouseup", this.onMouseUp);
                this.target.removeEventListener("contextmenu", this.onContextMenu);
                this.target = null;
            }
            this.reset();
        }

        reset(){
            this.pressedButtons = [];
        }

        handleMouseDown(event){
            let button = event.button; // 0-лкм,
            if (this.pressedButtons.indexOf(button) === -1){
                this.pressedButtons.push(button);
            }
            if(this.onUpdate) this.onUpdate();
        }

        handleMouseUp(event){
            let button = event.button;
            let index = this.pressedButtons.indexOf(button);
            if (index !== -1){
                this.pressedButtons.splice(index, 1);
            }
            if(this.onUpdate) this.onUpdate();
        }

        handleContextMenu(event){
            //если лкм исп как экшен - блокируем меню браузера
            event.preventDefault();
        }

        handleBlur(){
            this.reset();
            if(this.onUpdate) this.onUpdate();
        }

        //также плагин сам ищет параметр в экшене
        isActionActive(actionConfig){
            if(!actionConfig || !actionConfig.buttons) return false;

            for (let i = 0; i < actionConfig.buttons.length; i++){
                if(this.pressedButtons.indexOf(actionConfig.buttons[i]) !== -1){
                    return true;
                }
            }
            return false;
        }
    }
    class InputController {
        constructor(actionsToBind, target){
            this.ACTION_ACTIVATED = "input-controller:action-activated";
            this.ACTION_DEACTIVATED = "input-controller:action-deactivated";

            //пуб var состояния
            this.enabled = true;
            this.focused = true;
             

            // для хранения всех настроенных действий
            this.actions = {};
            this.plugins = [];

            //массив с кодами кнопок
            this.pressedKeys = [];

            this.target = null;


            this.onWindowFocus = () => {
                this.focused = true;
                this.updateAllActions();
            };
            this.onWindowBlur = () => {
                this.focused = false;
                this.updateAllActions();
            }

            // фокус окна браузера
            window.addEventListener("focus", this.onWindowFocus);
            window.addEventListener("blur", this.onWindowBlur);
              
            //по умолчанию - клава
            this.use(new KeyboardPlugin());

            if(actionsToBind){
                this.bindActions(actionsToBind);
            }
            if(target){
                this.attach(target);
            }
        }
        //подключение плагина
        use(plugin){
            plugin.init(() => this.updateAllActions());
            this.plugins.push(plugin);

            //если контроллер уже привязан к дом - привязываем новый
            if (this.target){
                plugin.attach(this.target);
            }
            return this;
        }
        //
        bindActions(actionsToBind){
            if (!actionsToBind) return;

            for (let actionName in actionsToBind){
                let actionData = actionsToBind[actionName];
                //let keys = actionData.keys || [];
                let enabled = actionData.enabled !== undefined ? actionData.enabled : true;

                if (!this.actions[actionName]){
                    this.actions[actionName] = {
                        //keys: [],
                        config: actionData, //сохр весь конфиг, чтобы плагины сами брали данные
                        enabled: enabled,
                        isActive: false
                    }; 
                } else {
                    //объед конфиг
                    Object.assign(this.actions[actionName].config, actionData);
                    if(actionData.enabled !== undefined){
                        this.actions[actionName].enabled = enabled;
                    }
                }
            }
        }
        //включение активности
        enableAction(actionName){
            let act = this.actions[actionName];
            if (act){
                act.enabled = true;
                //елси кнопка уже зажата - диспатчим активацию
                this.UpdateActionState(actionName);
            }
        }
        //отключение активности
        disableAction(actionName){
           let act = this.actions[actionName];
           if (act){
            act.enabled = false;
            if(act.isActive) {
                act.isActive = false;
                this.sendEvent(this.ACTION_DEACTIVATED, actionName);
            }           
           }
        }

        //привязка к dom элементу
        attach(target,dontEnable){
            if (!target) return;


            if (this.target){
                this.detach();
            }
            this.target = target;

            for(let i = 0; i<this.plugins.length;i++){
                this.plugins[i].attach(this.target);
            }

            //если нот енейбл не передан как тру, включаем контроллер.
            if (!dontEnable){
                this.enabled = true;
            }
        }
        //отцепление от дом элемента
        detach(){
            if (this.target){
                
                for(let i =0; i< this.plugins.length; i++){
                    this.plugins[i].detach();
                }

                this.target = null;                
            }
            this.enabled = false;
            //this.ResetPressedKeys();
            this.updateAllActions();
        }

        //проверка на активное действие(зажата хотя бы одна кнопка)
        isActionActive(action){
            if (!this.enabled || !this.focused){
                return false;
            }

            let act = this.actions[action];
            if (!act || !act.enabled){
                return false;
            }

            for(let i = 0; i < this.plugins.length; i++){
                if (this.plugins[i].isActionActive(act.config)){
                    return true;
                }
            }

            
            return false;
        }

        //проверка, нажата ли кнопка (конкретная) - UPDATE: делигирует проверку на плагин клавы(для тестов)
        isKeyPressed(keyCode){
            if (!this.enabled || !this.focused)  return false;

            for(let i = 0; i<this.plugins.length; i++){
                if(this.plugins[i] instanceof KeyboardPlugin){
                    return this.plugins[i].isKeyPressed(keyCode);
                }
            }
            return false;               
            //return this.pressedKeys.indexOf(keyCode) !== -1;
        } 


        updateAllActions(){
            for (let actionName in this.actions){
                this.UpdateActionState(actionName);
            }
        }
        UpdateActionState(actionName){
            let act = this.actions[actionName];
            if (!act) return;


            let shouldBeActive = this.isActionActive(actionName);

            //диспатчим строго при смене состояния
            if(shouldBeActive && !act.isActive){
                act.isActive = true;
                this.sendEvent(this.ACTION_ACTIVATED, actionName);
            } else if(!shouldBeActive && act.isActive){
                act.isActive = false;
                this.sendEvent(this.ACTION_DEACTIVATED,actionName);
            }

           
        }

        handleFocus(){
            this.focused = true;
            this.updateAllActions();
        }
        handleBlur(){
            this.focused = false;
            this.ResetPressedKeys();
        }

        

        //отправка кастомного события в целевой элемент
        sendEvent(eventName, actionName){
            if (!this.target) return;

            let event = new CustomEvent(eventName, {
                bubbles: true,
                detail: {
                    action : actionName
                }
            });
            
            this.target.dispatchEvent(event);
        }
    }

    //делаем класс доступным в глобал области видимости
    window.InputController = InputController;
    window.KeyboardPlugin = KeyboardPlugin;
    window.MousePlugin = MousePlugin;
})();
