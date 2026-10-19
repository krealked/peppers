(function(){
    class InputController {
        constructor(actionsToBind, target){
            this.ACTION_ACTIVATED = "input-controller:action-activated";
            this.ACTION_DEACTIVATED = "input-controller:action-deactivated";

            //пуб var состояния
            this.enabled = true;
            this.focused = true;
             

            // для хранения всех настроенных действий
            //{ left: { keys: [37, 65],
            //  enabled: true } }
            this.actions = {};

            //массив с кодами кнопок
            this.pressedKeys = [];

            this.target = null;

            // Привязываем контекст для обработчиков событий
            this.onKeyDown = this.handleKeyDown.bind(this);
            this.onKeyUp = this.handleKeyUp.bind(this);
            this.onWindowFocus = this.handleFocus.bind(this);
            this.onWindowBlur = this.handleBlur.bind(this);

            // фокус окна браузера
            window.addEventListener("focus", this.onWindowFocus);
            window.addEventListener("blur", this.onWindowBlur);
              
            //инициализация активности
            if (actionsToBind) {
                this.bindActions(actionsToBind);
            }
            if (target){
                this.attach(target);
            }
        }
        //
        bindActions(actionsToBind){
            if (!actionsToBind) return;

            for (let actionName in actionsToBind){
                let actionData = actionsToBind[actionName];
                let keys = actionData.keys || [];
                let enabled = actionData.enabled !== undefined ? actionData.enabled : true;

                if (!this.actions[actionName]){
                    this.actions[actionName] = {
                        keys: [],
                        enabled: enabled
                    }; 
                } else if(actionData.enabled !== undefined) {
                  //
                  this.actions[actionName].enabled = enabled;
                }
                for (let i = 0; i < keys.length; i++){
                    let key = keys[i];
                    if (this.actions[actionName].keys.indexOf(key) === -1){
                        this.actions[actionName].keys.push(key);
                    }
                }
            }
        }
        //включение активности
        enableAction(actionName){
            if (this.actions[actionName]){
                this.actions[actionName].enabled = true;
            }
        }
        //отключение активности
        desableAction(actionName){
            if(this.actions[actionName]){
                // Если кнопка действия сейчас зажата, отправляем сигнал отключения
                let wasActive = this.isActionActive(actionName);
                this.actions[actionName].enabled =  false;

                if (wasActive){
                    this.sendEvent(this.ACTION_DEACTIVATED,actionName);
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
            this.target.addEventListener("keydown", this.onKeyDown);
            this.target.addEventListener("keyup", this.onKeyUp);

            //если нот енейбл не передан как тру, включаем контроллер.
            if (!dontEnable){
                this.enabled = true;
            }
        }
        //отцепление от дом элемента
        detach(){
            if (this.target){
                this.target.removeEventListener("keydown", this.onKeyDown)
                this.target.removeEventListener("keyup", this.onKeyUp)
                this.target = null;                
            }
            this.enabled = false;
            this.ResetPressedKeys();
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

            for (let i = 0; i < act.keys.length; i++){
                let keyCode = act.keys[i];
                if (this.pressedKeys.indexOf(keyCode) !== -1){
                    return true;
                }
            }
            return false;
        }

        //проверка, нажата ли кнопка (конкретная)
        isKeyPressed(keyCode){
            if (!this.enabled || !this.focused){
                return false;
            }
            return this.pressedKeys.indexOf(keyCode) !== -1;
        }

        //обработчик нажатия клавиши
        handleKeyDown (event){
           if (event.repeat) return; //игнор удержания клавиши ОС
           
           let code = event.keyCode || event.which;
           
           //запоминаем нажатую клавишу
           if (this.pressedKeys.indexOf(code) === -1){
            this.pressedKeys.push(code);
           }

           if (!this.enabled || !this.focused) return;

           this.updateAllActions();
        }

        //обработчик отжатия клавиши
        handleKeyUp(event){
            let code = event.keyCode || event.which;

            //удаляем клавишу из списка зажатых
            let index = this.pressedKeys.indexOf(code);
            if (index !== -1){
                this.pressedKeys.splice(index,1);
            }

            if (!this.enabled || !this.focused) return;

            this.updateAllActions();
        }

        updateAllActions(){
            for (let actionName in this.actions){
                this.UpdateActionState(actionName);
            }
        }
        UpdateActionState(actionName){
            let act = this.actions[actionName];
            if (!act) return;

            //проверяем зажата ли сейчас хотя бы одна кнопка для действия
            let hasAnyKeyPressed = false;
            if(this.enabled && this.focused && act.enabled){
                for (let i = 0; i< act.keys.length;i++){
                    if (this.pressedKeys.indexOf(act.keys[i]) !== -1){
                        hasAnyKeyPressed = true;
                        break;
                    }
                }
            }

            if (hasAnyKeyPressed && !act.isActive){
                act.isActive = true;
                this.sendEvent(this.ACTION_ACTIVATED,actionName);
            }
            else if(!hasAnyKeyPressed && act.isActive) {
                act.isActive = false;
                this.sendEvent(this.ACTION_DEACTIVATED, actionName)

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

        //сброс зажатых кнопок при потере фокуса или выключении
        ResetPressedKeys() {
            this.pressedKeys = [];
            for (let actionName in this.actions) {
                let act = this.actions[actionName];
                if (act.isActive){
                    act.isActive = false;
                    this.sendEvent(this.ACTION_DEACTIVATED, actionName)
                }
            }
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
})();