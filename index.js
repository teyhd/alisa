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

var autorized = ["77DF03EA4C60CAAC5F65B1614190796719E00C6EF3B06F7D0F05C5F387196178"];
var coffSin = [{name:"coffee",privat:true},"кофе","чай","чаю","чайку","чаечек"];
var offSin = [{name:"get_dev_off",privat:true},"выключи","оффни"];
var raspsin = [{name:"rasp_get_date",privat:false},"расписание","пары","пара","фары"];
var rebsin = [{name:"get_dev_reb",privat:true},"перезагрузи"];
var slesin = [{name:"get_dev_sleep",privat:true},"сон"];
var commands = [coffSin,offSin,raspsin,rebsin,slesin]; //Собираем структуру для удобства обработки

var comppar={name:"comppar",hostp:"192.168.0.104",usernamep:"spiderman201010@mail.ru",passwordp:"Vlad281000",type:"win"};
var labtoppar={name:"labtoppar",hostp:"192.168.0.106",usernamep:"spiderman201010@mail.ru",passwordp:"Vlad281000",type:"win"};
var servpar={name:"servpar",hostp:"192.168.0.107",usernamep:"root",passwordp:"258000",type:"lin"};
var calendpar={name:"calendpar",hostp:"192.168.0.103",usernamep:"root",passwordp:"258000",type:"lin"}
var coffedevpar={name:"coffedevpar",hostp:"192.168.0.103",usernamep:"root",passwordp:"258000",type:"coffee"};

var comp=[comppar,"компьютер","пк","комп"];
var labtop = [labtoppar,"ноутбук","ноут"];
var serv = [servpar,"сервер"];
var calend = [calendpar,"календарь"];
var coffedev = [coffedevpar,"кофеварку"];

var devices = [comp,serv,calend,labtop,coffedev];

app.use(express.json());
var resA,reqA;
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
});

app.use('*', function (req, res) {
  res.sendStatus(404);
});

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
            ans("Не знаю");
            answered = true;
        break;
        case 'крокодил':
            set_adm();
            ans("Вы авторизованы");
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
    for(let i=0;i<offSin.length;i++){
         if (autorized.includes(reqA.body.session.user_id)) return true;
            else return false;
}
} //Проверяет пользователя админ ли он
function set_adm(){
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
} //Get запрос достает расписание 

function coffee(par){
    let cmd = null;
    if (par==0){
        cmd = 'echo p 18 0 > /dev/pigpio';
        console.log("Кофеварка выключена");
        ans("Кофеварка выключена");
    } else {
        cmd = 'echo p 18 255 > /dev/pigpio';
        setTimeout(coffee, 1000*60*5,0);
        ans("Напиток скоро будет готов!");
        console.log("Кофеварка включена");
    }
 ssh_send(cmd,coffedevpar.hostp,coffedevpar.usernamep,coffedevpar.passwordp);
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
         //off_dev(param);
     } else ans("Такого устройства нет");
} //Переводит слово в параметры устройства 
function get_dev_off(par){
  let cmd = null;
  let deviceinfo = get_dev(par);
    if (deviceinfo.type=="win") cmd = "shutdown -s -t 0";
    if (deviceinfo.type=="lin") cmd = "init 0";
    if (deviceinfo.type=="coffee") cmd = "echo p 18 0 > /dev/pigpio";
  ssh_send(cmd,deviceinfo.hostp,deviceinfo.usernamep,deviceinfo.passwordp); 
  ans("Ваше устройство скоро выключиться!");
} //Отправляет команду на выключение
function get_dev_reb(par){
  let cmd = null;
  let deviceinfo = get_dev(par);
    if (deviceinfo.type=="win") cmd = "shutdown -r";
    if (deviceinfo.type=="lin") cmd = "init 6";
    if (deviceinfo.type=="coffee") ans("Это устройство нельзя перезагрузить"); 
  ssh_send(cmd,deviceinfo.hostp,deviceinfo.usernamep,deviceinfo.passwordp); 
  ans("Ваше устройство скоро перезагруиться!");  
} //Отправляет команду на перезагрузку
function get_dev_sleep(par){
  let cmd = null;
  let deviceinfo = get_dev(par);
  if (deviceinfo.type=="win") cmd = "shutdown -h";
  if (deviceinfo.type=="lin") ans("Это устройство не может уснуть"); 
  if (deviceinfo.type=="coffee") ans("Это устройство не может уснуть"); 
  ssh_send(cmd,deviceinfo.hostp,deviceinfo.usernamep,deviceinfo.passwordp); 
  ans("Ваше устройство скоро уснет!");  
} //Отправляет команду на сон

function ssh_send(cmd,hostp,usernamep,passwordp){
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
} //Ответ пользователю
process.on('uncaughtException', (err) => {
  console.log('whoops! there was an error', err.stack);
}); //Если все пошло по пизде, спасет ситуацию
//https://teyhd.ru/alisa/test.php
//http://localhost/weather.php