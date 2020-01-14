const electron = require('electron')

import { environment } from '../globals.js'

// Knex Connection Initialization
const knex = require('knex')({
    client: 'sqlite3',
    connection: { filename: `./db.sqlite` }
})

const newClientModal = $('#newClientModal')
const btnShowNewClientModal = $('#btnShowNewClientModal')
const btnAddClient = $("#btnAddClient")
const txtAddClientFullname = $("#txtAddClientFullname")
const txtAddClientPhone = $("#txtAddClientPhone")
const checkBalanceModal = $("#checkBalanceModal")
const btnCheckBalance = $("#btnCheckBalance")
const btnShowSendSMSModal = $("#btnShowSendSMSModal")
const sendSMSModal = $("#sendSMSModal")
const txtSearchClient = $("#txtSearchClient")
const btnShowBuyCreditWin = $("#btnShowBuyCreditWin")
const btnCloseSMSModal = $("#btnCloseSMSModal")
const clientExistsError = $("#clientExistsError")

// Modal of Adding client
btnShowNewClientModal.on('click', function() {
    newClientModal.modal({closable: false}).modal('show')
})

txtAddClientPhone.on('keydown', function(e) {
    acceptOnlyNumbers(e)
})

btnAddClient.on('click', function() {
    let $this = $(this)
    let fn = txtAddClientFullname.val().trim()
    let ph = txtAddClientPhone.val().trim()

    $this.closest('form').removeClass('success error')
    clientExistsError.addClass('hide')

    if (!fn.length || !ph.length) {
        $this.closest('form').addClass('error').removeClass('loading')
        return
    }
    if (ph.length != 10) {
        $this.closest('form').addClass('error').removeClass('loading')
        return
    }

    knex('clients').select().where({phone: ph}).then(function(client) {
        if (client.length) {
            clientExistsError.removeClass("hide")
        } else {
            knex('clients').insert({fullname: fn, phone: ph})
            .then(() => {
                $this.closest('form').addClass('success').removeClass('loading') 
            })
        }
    })    
    
    // knex('clients').insert({fullname: fn, phone: ph})
    // .then(() => {
    //     $this.closest('form').addClass('success').removeClass('loading') 
    // })
})

// Cheking balance
let checkBalBaseURL = 'https://api.mnotify.com/api/balance/sms';
btnCheckBalance.on('click', function() {
    // document.createElement
    // $.load('https://apps.mnotify.net', function() {

    // })
    $.get(`${checkBalBaseURL}?key=${environment.API_KEY}`, function(resData) {
        const contentContainer = checkBalanceModal.find('.content');
        const balanceValueContainer = contentContainer.find('#balanceValueContainer')

        contentContainer.children('.segment').addClass('hide')
        balanceValueContainer.removeClass('hide')
        balanceValueContainer.children('#balanceVal').text(`Balance: ${resData.balance}`)
        balanceValueContainer.children('#bonusVal').text(`Bonus: ${resData.bonus}`)
    })
    checkBalanceModal.modal({closable: false}).modal('show')
})

// Sending SMS Modal
btnShowSendSMSModal.on('click', function() {
    sendSMSModal.modal({ closable: false }).modal('show')    
})

btnCloseSMSModal.on("click", function() {
    txtSearchClient.val("")
    selectedClientsContainer.empty()
    clientsSearchListElement.addClass('hide')
})

// Searching for clients
let res = []
const clientsSearchListElement = $("#clientsSearchList")
txtSearchClient.on('keyup', function() {
    const $this = $(this)
    const searchValue = $this.val().trim()
    let dataToAppend = '<ul>'
    clientsSearchListElement.removeClass('hide')
    
    if ($this.val().length) {
        $this.parent('.ui').addClass('loading')
        knex('clients').where('fullname', 'like', `${searchValue}%`).select('fullname', 'phone').then(function(clients) {
            for (let i = 0; i < clients.length; i++) {
                dataToAppend += `<li class='client-list-item'>${clients[i].fullname} - ${clients[i].phone}</li>`
            }
            dataToAppend += '</ul>'
            clientsSearchListElement.html(dataToAppend)
            $this.parent('.ui').removeClass('loading')
        })
    } else {
        clientsSearchListElement.addClass('hide')
    }

})

// Searching for Clients
const selectedClientsContainer = $('#selectedClientsContainer')
clientsSearchListElement.on('click', '.client-list-item', function() {
    let $this = $(this)
    
    if (!checkClientAlreadyAdded($this.text().split('-')[1].trim())) {
        $this.append(`<i class="icon delete delete-Client-To-SendMessage" id=${$this.text().split("-")[1]}></i>`)
        selectedClientsContainer.append($this)
    }

})

// Removing selected client
selectedClientsContainer.on('click', '.delete-Client-To-SendMessage', function() {
    $(this).closest('li').remove()
})

// Sending SMS
const btnSendClient = $("#btnSendClient")
let receiver = ''
const message = $("#message")
const smsURL = `https://apps.mnotify.net/smsapi?key=${environment.SMS_KEY}&sender_id=${environment.SENDER}`
btnSendClient.on('click', function() {
    const clientsSelectedArray = selectedClientsContainer.children()
    $.each(clientsSelectedArray, function(i, ele) {
        receiver = ele.childNodes[1].id
        const element = $(`#${receiver}`).parent('li')
        $.get(`${smsURL}&to=${receiver}&msg=${message.val()}`, function(res) {
            if (res == 1000) {
                // 1000 = Message submited successful
                element.addClass('success-flag')
            } else if (res == 1002) {
                // 1002 = SMS sending failed
                element.addClass('error-flag')
            } else if (res == 1003) {
                // 1003 = insufficient balance
                element.addClass('info')
            }
        })
    })

    // for (let i = 0; i < clientsSelectedArray.length; i++) {
    //     // receiver = clientsSelected[i].attr('id')
    //     console.log(clientsSelectedArray[i])
    //     // $.get(`${smsURL}&to=${receiver}&msg=${message}`, function(res) {
    //     //     console.log(res)
    //     //     console.log('joeee')
    //     // })
    // }
})

// Show Buy Credit modal
btnShowBuyCreditWin.on('click', function() {
    const BrowserWindow = electron.remote.BrowserWindow
    let buyCreditWin = new BrowserWindow({
        // fullscreen: true,
        modal: true,
        minHeight: 600,
        minWidth: 1000,
        skipTaskbar: true,
        title: 'SMS'
    })
    buyCreditWin.maximize()

    buyCreditWin.loadURL('https://apps.mnotify.net/topup/bundle_list')
})


function checkClientAlreadyAdded(phoneNumber) {
    let numberExists
    $.each(selectedClientsContainer.children('li'), function(i, liELe) {
        if (liELe.innerText.split('-')[1].trim() == phoneNumber) {
            numberExists = true
        } else {
            numberExists = false
        }
    })
    return numberExists
}

function acceptOnlyNumbers(e) {
    var key = e.which || e.keyCode;
    var counter = 0;
    var value = e.target.innerHTML.trim() || e.target.value;

    if (
        !(
            (!e.shiftKey &&
                !e.altKey &&
                !e.ctrlKey &&
                // numbers
                key >= 48 &&
                key <= 57) ||
            // Numeric keypad
            (key >= 96 && key <= 105) ||
            // Backspace
            key == 8 ||
            // Home and End
            key == 35 ||
            key == 36 ||
            // left and right arrows
            key == 37 ||
            key == 39 ||
            // Del and Tab
            key == 46 ||
            key == 9
        )
    ) {
        e.preventDefault();
    }

    if (value) {
        for (let i = 0; i < value.length; i++) {
            if (value[i] == ".") {
                counter++;
            }
        }
    }

    if (counter > 0 && (key == 110 || key == 190)) {
        e.preventDefault();
    }
}



