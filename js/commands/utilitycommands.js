const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
]

function echo(args){
	printMessage(args.join(' '))
}

function pwd(){
	printMessage(curr_dir.getPath(), "green")
}

function timer(args){
	if(!args[0]){
		printMessage("timer: missing operand", "red")
		printMessage("Try 'man timer' for more information", "red")
		return
	}
	switch(args[0]){
		case "start":
			myTimer.start()
			break
		case "stop":
		myTimer.stop()
			break
		case "reset":
		myTimer.reset()
			break
		case "get":
		printMessage(myTimer.getTime())
		default:
			break
	}
}

function commands(){
	for (let cmd of allCommands){
		printMessage(cmd.getName(), "green")
	}
}

function man(args){
	if(!args[0]){
		printMessage("man: missing operand", "red")
		printMessage("Type 'man [command]' for information on any command", "red")
		return
	}
	for (let cmd of allCommands){
		if(cmd.getName() == args[0]){
			printMessage("command: "+cmd.getName(), "green")
			printMessage("description: "+cmd.getHelp(), "green")
			printMessage("usage: "+cmd.getUsage(), "green")
			document.getElementById('input_field').value = ''
			return
		}
	}
	printMessage("command not found: "+args[0])
}

function pageDesc(){
	printMessage("This startpage is intended to look & act like a unix terminal.", "green")
	printMessage("You can create and manage directories and files - dorectories "+
		"act as bookmark folders and files as bookmark links", "green")
	printMessage("The most common unix commands such as [cd|touch|mkdir|rm|rmdir] are supported!", "green")
	printMessage("Try typing 'commands' for a list of commands or 'man [command]' for help "+
		"with a specific command", "green")
}

function time(){
	let date = new Date()
	printMessage("Today is the "+date.getDate()+"th of "+months[date.getMonth()]+" - The time is "+
		date.getHours()+" | "+date.getMinutes() +" | "+date.getSeconds()+".", "green")
}

function locate(args){
	if(args[0]){
		window.open("https://duckduckgo.com/"+args.join(' '));
	} else {
		printMessage("Please enter a valid search query", "red")
	}
}