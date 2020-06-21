var express = require('express');
var app = express();
var request = require('request');
var rp = require('request-promise');
var fs = require('fs');
var Client = require('ssh2').Client;
var io = require('socket.io');
var key = fs.readFileSync('/var/www/html/alisa/encryption/private.key');
var cert = fs.readFileSync('/var/www/html/alisa/encryption/primary.crt');
var ca = fs.readFileSync('/var/www/html/alisa/encryption/intermediate.crt');
var settings = JSON.parse(fs.readFileSync('/var/www/html/alisa/encryption/set.json', 'utf8')); //Берем настройки из файла
var struct = JSON.parse(fs.readFileSync('/var/www/html/alisa/encryption/struct.json', 'utf8')); //Подгружаем структуры
var options = {
    key: key,
    cert: cert,
    ca: ca
};
var app = require('express')();
var https = require('https');
var server = https.createServer(options, app);
var io = require('socket.io').listen(server);

server.listen(1883); console.log("Навык запущен");

var autorized = struct[0].autorized; //авторизованные пользователи
var commands = [struct[0].coffSin,
                struct[0].offSin,
                struct[0].raspsin,
                struct[0].rebsin,
                struct[0].slesin, 
                struct[0].ans,
                struct[0].wake_up,
                struct[0].vkmsg]; //Собираем структуру команд для удобства обработки
                
var devices = [struct[1].comp,
               struct[1].serv,
               struct[1].calend,
               struct[1].labtop,
               struct[1].coffedev]; //Собираем структуру устройств для удобства обработки

var vkmsgs; //Сообщения из вк
var user_id_to_ans = []; //Пользователи
//Избранные пользователи
user_id_to_ans[10]=237467639; //Тк
user_id_to_ans[11]=254088396; //Сергей
user_id_to_ans[12]=460886453; //медве
//get_msg_VK();
app.use(express.json());
var resA,reqA; //Сообщения глобальо доступны
app.post('/', function (req, res) {
    resA=res;reqA=req;
    console.log(req.body.session.user_id);
    console.log(req.body.request.nlu.tokens);
    console.log(req.body.request.nlu.entities);
   
    if (!speech(req.body.request.command)){
        if(!brain(req.body.request.nlu.tokens)){
            ans("Я такого не знаю \nСпроси 'Что ты умеешь?'");
        }
    }
   /* if ((req.body.request.command!="ping") && (req.body.request.command!="")){
          get_msg_VK();
    } */
});

app.use('*', function (req, res) {
  res.sendStatus(404);
});
var ping_value = 0;
function speech(stext){
    let answered = false;
    switch (stext) {
         case '':
            ans("Внимание навык является приватным! \nЧтобы узнать возможности скажи: 'Что ты умеешь?'");
            answered = true;
        break;
        case 'Что ты умеешь?':
        case 'что ты умеешь':
            ans("Управлять умной комнатой.\nОтправлять запросы на raspberry pi 3.\nРасскажу пары на завтра, но не ваши");
            answered = true;
        break;
        case 'ping':
            ping_value++;
            console.log(`Яндекс пинг: №${ping_value}`);
            ans("Не знаю");
            answered = true;
        break;
        case 'крокодил':
            set_adm();
            ans("Вы авторизованы");
            answered = true;
        break;    
        case 'помоги':
        case 'помощь':
        case 'помощи':
            ans("Слушаю");
            answered = true;
        break;
        case 'спасибо':
            ans("Обращайтесь");
            answered = true;
        break;
    }
    return answered;
} //Разгооврный модуль
function brain(gtok){
    let is_adm = get_adm();
    let result =false;
    for(let i=0;i<commands.length;i++){
        result = check(commands[i],gtok);
        console.log(result);
        if(result!=false) break; 
    }
    if(result!=false){
        if(result.privat){
            if (is_adm) worker(result.name,gtok);
                else ans("Недостаточно прав чтобы использовать этот метод!\nАвторизуйтесь чтобы вызвать эту функцию");
        } else worker(result.name,gtok);
        return true;
    } else return false;
} //Первичный обработчик запросов
function worker(job,gtok){
    console.log(`${job}(gtok)`);
    eval(`${job}(gtok)`);
} //Распределяет выполнение функций
function check(arr,gtok){
    console.log(arr.length);
     for(let i=0;i<arr.length;i++){
         if (gtok.includes(arr[i])){
             return arr[0];
         }  
     } 
     return false;
} //Проверяет сказал ли пользователь что-то толковое

function get_adm(){
    for(let i=0;i<autorized.length;i++){
         if (autorized.includes(reqA.body.session.user_id)) return true;
            else return false;
}
} //Проверяет пользователя админ ли он
function set_adm(){
    console.log(autorized);
    if(autorized.includes(reqA.body.session.user_id)==false)
    autorized.push(reqA.body.session.user_id);
} //Добавляет текущего пользователя в список админов

function rasp_get_date(gg){
    var now = new Date();
    var day = now.getDate();
    var month = now.getMonth()+1;

    var year = now.getFullYear();

    var ans_date = 0;
    
    console.log(reqA.body.request.nlu.tokens);
    
    if (reqA.body.request.nlu.tokens.length<2) ans_date = 0;
    try {
        if (reqA.body.request.nlu.entities[0].value.day!=undefined){
            if(reqA.body.request.nlu.entities[0].value.day_is_relative){
              day = day+reqA.body.request.nlu.entities[0].value.day;  
            } else {
              day = reqA.body.request.nlu.entities[0].value.day;
            }
        ans_date = `${year}-${month}-${day}`;
    }
    } catch (e) {}
    try {
        if (reqA.body.request.nlu.entities[1].value.day!=undefined){
            if(reqA.body.request.nlu.entities[1].value.day_is_relative){
              day = day+reqA.body.request.nlu.entities[1].value.day;  
            } else {
              day = reqA.body.request.nlu.entities[1].value.day;
            }

        ans_date = `${year}-${month}-${day}`;
    }
    } catch (e) {}    
    try {
        if (reqA.body.request.nlu.entities[1].value.month!=undefined){
    month = reqA.body.request.nlu.entities[1].value.month;

    ans_date = `${year}-${month}-${day}`;
    }
    } catch (e) {}
    if (reqA.body.request.nlu.tokens.includes("сегодня")) ans_date = 0;
    console.log(ans_date);
    rasp(ans_date);
} //Корректирует дату взависимости от услышанного
function rasp(par){
    var options = {
    method: 'POST',
    uri: 'http://localhost/alisa/test.php',
    form: {
        date: par
    },
    headers: {
        /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
    }
};
 
rp(options)
    .then(function (body) {
        let answ="";
            body = JSON.parse(body);
            answ=body;
                ans(answ);
    })
    .catch(function (err) {
        ans("Произошла ошибка получения пар");
    });
    
    //return answ;
} //запрос достает расписание 

function coffee(par){
    let cmd = null;
    if (par==0){
        cmd = 'echo p 18 0 > /dev/pigpio';
        console.log("Кофеварка выключена");
        ans("Кофеварка выключена");
    } else {
        cmd = 'echo p 18 255 > /dev/pigpio';
        setTimeout(coffee, 300000,0);//300000
        ans("Напиток скоро будет готов!");
        console.log("Кофеварка включена");
    }
    if (cmd!=null) ssh_send(cmd,struct[1].coffedev[0]);
} //Управление кофеваркой

function get_dev(par){
    console.log(par);
    let result = false;
    let param;
     for(let i=0;i<devices.length;i++){
        result = check(devices[i],par);
        console.log(result);
        if(result!=false) break;
     }
     if(result!=false){
         return result;
     } else ans("Такого устройства нет");
} //Переводит слово в параметры устройства 
function get_dev_off(par){
  let cmd = null;
  let deviceinfo = get_dev(par);
    if (deviceinfo.type=="win") cmd = "shutdown -s -t 0";
    if (deviceinfo.type=="lin") cmd = "init 0";
    if (deviceinfo.type=="coffee") cmd = "echo p 18 0 > /dev/pigpio";
    if (cmd!=null) ssh_send(cmd,deviceinfo); 
  ans("Ваше устройство скоро выключиться!");
} //Отправляет команду на выключение
function get_dev_reb(par){
  let cmd = null;
  let deviceinfo = get_dev(par);
    if (deviceinfo.type=="win") cmd = "shutdown -r";
    if (deviceinfo.type=="lin") cmd = "init 6";
    if (deviceinfo.type=="coffee") ans("Это устройство нельзя перезагрузить"); 
    if (cmd!=null) ssh_send(cmd,deviceinfo); 
  ans("Ваше устройство скоро перезагрузиться!");  
} //Отправляет команду на перезагрузку
function get_dev_sleep(par){
  let cmd = null;
  let deviceinfo = get_dev(par);
  if (deviceinfo.type=="win") cmd = "shutdown -h";
  if (deviceinfo.type=="lin") ans("Это устройство не может уснуть"); 
  if (deviceinfo.type=="coffee") ans("Это устройство не может уснуть"); 
  if (cmd!=null) ssh_send(cmd,deviceinfo); 
  ans("Ваше устройство скоро уснет!");  
} //Отправляет команду на сон

function ssh_send(cmd,device_info){
    let usernamep,passwordp;
    let hostp = device_info.hostp;
    if (device_info.type=="win"){
        usernamep = settings.pc.login
        passwordp =  settings.pc.pass
    }
    if ((device_info.type=="lin")||(device_info.type=="coffee")){
        usernamep = settings.serv.login
        passwordp =  settings.serv.pass
    }

  let conn = new Client();
conn.on('ready', function() {
    conn.exec(cmd, function(err, stream) {
    if (err) throw err;
    stream.on('close', function(code, signal) {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', function(data) {
      console.log('STDOUT: ' + data);
    }).on('error', function(data) {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', function(data) {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: hostp,
  port: 22,
  username: usernamep,
  password: passwordp
});
} //Отправка SHH команды
function ans(atex){
    console.log(atex);
    try {
     resA.json({
      version: reqA.body.version,
      session: reqA.body.session,
        response: {
          text: atex,
          //tts: "<speaker audio=\"alice-sounds-game-win-1.opus\"> "+atex,
          //tts:`<speaker effect="psychodelic">${atex}`,   
          end_session: false,
        },
    })
    } catch (e) {
        console.log(e);
    }
} //Ответ пользователю

function get_msg_VK(){
    console.log(user_id_to_ans);
    var options = {
    method: 'POST',
    uri: 'http://localhost/iambot/alisa.php',
    form: {
      act: 'get'
    }
};
 
rp(options)
    .then(function (body) {
        let answ="";
        if (body!=undefined){
            body = JSON.parse(body);
            answ=body;
            vk_msg_decode(answ);
        } else console.log('EMPTYBLYA');
 
    })
    .catch(function (err) {
         console.log("Произошла ошибка получения сообщений\n");
         console.log(err);
    });
    
    //return answ;
} //запрос для получения сообщений

function get_id_VK(text,usrname){
    var options = {
    method: 'POST',
    uri: 'http://localhost/iambot/alisa.php',
    form: {
      act: 'name',
      usr:usrname
    }
};
 rp(options)
    .then(function (body) {
        let answ = '';
        if (body!=undefined){
            answ = JSON.parse(body);
            if(answ!='non'){
                answerVK(text,answ); 
            } else ans("Такого человека нет");
        } else console.log('EMPTYBLYA');
 
    })
    .catch(function (err) {
         console.log("Произошла ошибка получения сообщений\n");
         console.log(err);
    });
} //запрос для получения id по имени
function vk_msg_decode(answ){
    let msgs = '';
    if(answ=="non") return("Сообщений нет");
        else{
            for (let i=1;i<=answ[0];i++){
                msgs += `Сообщение №${i}\nПользователь: ${answ[i].name}\nТекст сообщения: ${answ[i].msg}\n`;
                user_id_to_ans[i] = answ[i].id; 
            }
            console.log(msgs);
           ans (`Количество сообщений ${answ[0]}.\n${msgs}`); 
        }
} //Запись сооющений 
function say_msg(){
    get_msg_VK();
  //  ans(vkmsgs);
} //Озвучить сообщения

function answerVK(text,user_id){
    var options = {
    method: 'POST',
    uri: 'http://localhost/iambot/alisa.php',
    form: {
        act: 'send',
        msg:text,
        usr:user_id
    }
};
 
rp(options)
    .then(function (body) {
        body = JSON.parse(body);
        if (body='ok') ans('Сообщение успешно отправлено');
        else ans('Ошибка при отправке сообщения');
             console.log(body);
    })
    .catch(function (err) {
        console.log("Erorors");
    });
    
    //return answ;
} //Отправка сообщений пользователю вк
function prepare_ans(par){
    try {
      if(reqA.body.request.nlu.entities[0].value!=undefined){
     let from = reqA.body.request.nlu.entities[0].value;
     let anstext="";
         if(user_id_to_ans[from]!=undefined){
            for(let i = reqA.body.request.nlu.entities[0].tokens.end;i<par.length;i++){
              anstext += `${par[i]} `;  
            } 
            if (anstext.length>0){
                anstext = ucFirst(anstext);
               answerVK(anstext,user_id_to_ans[from]); 

            } else ans("Мало текста");
         } else
         {
             if(reqA.body.request.nlu.entities[0].value.first_name!=undefined){
                 let name = reqA.body.request.nlu.entities[0].value.first_name;
                 for(let i = reqA.body.request.nlu.entities[0].tokens.end;i<par.length;i++){
                      anstext += `${par[i]} `;  
                    } 
                    if (anstext.length>0){
                        anstext = ucFirst(anstext);
                        get_id_VK(anstext,name);
                    } else ans("Мало текста");    
             } else ans("Такого человека нет");
         }
         
     }
    } catch (e) {
        ans("Сейчас при попытки к бегству был пойман Косяк, не беспокойтесь!");
    }
     
     //ans("Окей");
} //Выдираем из запроса сообщения для отпраавки
function prepare_wake_up(par){
    try {
       if(reqA.body.request.nlu.entities!=undefined){
     let from = reqA.body.request.nlu.entities[0].value;
     let anstext="";
         if(user_id_to_ans[from]!=undefined){
            for(let i = reqA.body.request.nlu.entities[0].tokens.end;i<par.length;i++){
                ddos_vk(par[i],user_id_to_ans[from],i);
            } 
            ans("Сейчас разбудим");
         } else ans("Такого человека нет");
     }
    } catch (e) {
        ans("Сегодня при попытки к бегству был пойман Косяк, не беспокойтесь!");
    }
     
     //ans("Окей");
} //Выдираем из запроса сообщения и отправляет по одному
function ddos_vk(anstext,whosend,wait){
    if (anstext.length>0){
                anstext = ucFirst(anstext);
                setTimeout(answerVK, wait*1000, anstext, whosend);
            } else setTimeout(answerVK, 300, "...", whosend);;
}//Ддосим вк



function ucFirst(str) {
  if (!str) return str;

  return str[0].toUpperCase() + str.slice(1);
} //Поднять первую букву

process.on('uncaughtException', (err) => {
    ans("Пойман глобальный косяк при попытки к бегству!!! Не беспокойтесь!!!!");
  console.log('whoops! there was an error', err.stack);
}); //Если все пошло по пизде, спасет ситуацию
//https://teyhd.ru/alisa/test.php
//http://localhost/weather.php