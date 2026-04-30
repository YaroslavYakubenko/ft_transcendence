*This project has been created as part of the 42 curriculum by tabading.*

# Table of Contents
- [Description](#Description)
	- [What's currently working](#What's-currently-working)
	- [seperate features not implemented correctly yet](#seperate-features-not-implemented-correctly-yet)
- [Instructions](#Instructions)
- [Roadmap](#Roadmap)
- [Suggestions](#Suggestions)
- [Bug report](#Bug-report)


#	Description

Building the chess game with python-chess and pygame.

## What's currently working

- open game window
- display a chess board with extra space to the right
- click on corect color piece highlights square
	- only one can be selected
	- clicking selected deselects it
	- legal moves of that piece are displayed
- can move pieces to legal spaces 
	- if your in check you can't be an idiot 


## seperate features not implemented correctly yet

- when in check getting out of it is the only legal action
which makes losing kinda hard

# Instructions

- enter folder 
- either download chess and pygame or create a venv
	- python -m venv venv
	- .\venv\Scripts\Activate.ps1
	- pip install pygame
	- pip install chess
- python3 main.py

# Roadmap

- Board
	- Draw board									[✅]
	- detect mouse / select square					[✅]
	- highlight selected square						[✅]
	- flip rotate board -> black/white viewpoint	[]
	- draw menu buttons to the right				[]
		- game start								[]
			- friendly or tournament 				[]
				- (random or chose color)
		- game forfit								[]
		- game custimization
			- new menu open							[]
				- board 							[]
				- pieces							[]
				- movement 							[]

- Pieces 
	- Place in correct square to start				[✅]
	- enable click-click							[✅]
	- enable drag'n drop							[]
		- snap into board square					[]

- logic
	- clicking piece recognizes type				[✅]
		- highlight legal moves 					[✅]
			- turn on/off							[]
	- check occupied destination
		- same color not allowed					[✅]
		- other color delete taken pieces 			[✅]
	- allow only legal moves 						[✅]
	- allow to miss check							[]
	- check / check mate							[]
	- castling										[]
	- promotion 									[]

- custimization
	- white / black selection at start				[]
		- random or choosable						[]
	- different pngs for the pieces					[]
	- board colors									[]
		-> highlight color							[]
	- switching movement type						[]

- game necesity 
	- forfit button									[]
	- new game start								[]
		- tournament mode or friend mode 			[]


# Suggestions

If you have any suggestions please put them here:

- 
- 
- 

# Bug report

If you found a bug while testing please document here Thanks:

[tabading]:
Piece drawn under board tiles
[how_to_recreate]
- start game
- move piece around
