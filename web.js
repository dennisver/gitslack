require('dotenv').config()
const express = require('express')
const schedule = require('node-schedule')
const fetch = require('node-fetch')
const { WebClient } = require('@slack/client')

const app = express()

const web = new WebClient(process.env.SLACK_TOKEN)
let lastFetchedDate = new Date('26 February 2018 14:48 UTC').toISOString()

function buildNotificationContent(notification) {
	var url = "https://github.com"+ notification.subject.url.split('https://api.github.com/repos')[1]
	return {
		"username": "Github",
		"icon_emoji": ":github:",
	    "attachments": [
	        {
	            "title": notification.subject.title,
	            "title_link": url,
	            "text": notification.subject.type +" - "+ notification.reason
	        }
	    ]
	}
}

function sendSlackMessage(notification) {
	let message = buildNotificationContent(notification)
	web.chat.postMessage(process.env.SLACKBOT_ID, '', message)
		.catch(err => console.log(err))
}

function getNewNotifications(notifications) {
	notifications.forEach( async (notification) => {
		sendSlackMessage(notification)
	})
}

function fetchGithub() {
	let endpoint = 'https://api.github.com/notifications?since='+ lastFetchedDate
	fetch(endpoint, {
		headers: { 'Authorization': 'Bearer ' + process.env.GITHUB_TOKEN }
	})
		.then(res => res.json())
		.then(json => {
			lastFetchedDate = new Date().toISOString()
			getNewNotifications(json)
		})
}

var j = schedule.scheduleJob('*/5 * * * *', function(){
	fetchGithub()
})

fetchGithub()

app.listen(process.env.PORT || 5000)


