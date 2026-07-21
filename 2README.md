*This project has been created as part of the 42 curriculum by <jastomme>, <yyakuben>, <jfischer>, <tabading>.*

# Table of Contents
- [Description](#description)
	- [Team Information](#team-information)
	- [Project Management](#project-management)
	- [Technical Stack](#technical-stack)
	- [Database Schema](#database-schema)
	- [Features List](#features-list)
	- [Modules](#modules)
	- [Individual Contributions](#individual-contributions)

- [Instructions](#instructions)

- [Resources](#resources)

# Description

## Team Information
For each team member mentioned at the top of the README.md, you must provide:
◦ Assigned role(s): PO, PM, Tech Lead, Developers, etc.
◦ Brief description of their responsibilities.

<jastomme>: PM, Developer, Devops
<yyakuben>: Frontend, Developer
<jfischer>: Backend, Developer
<tabading>: Game, Developer

## Project Management
◦ How the team organized the work (task distribution, meetings, etc.).
◦ Tools used for project management (GitHub Issues, Trello, etc.).
◦ Communication channels used (Discord, Slack, etc.).

- started with planing out responsibilities
- regular meetings to check on progress
- worked with Github 
- communication over slack

## Technical Stack
◦ Frontend technologies and frameworks used.
◦ Backend technologies and frameworks used.
◦ Database system and why it was chosen.
◦ Any other significant technologies or libraries.
◦ Justification for major technical choices.

- frontend: React + TypeScript + Vite
- backend: Django + Django REST Framework
- db: PostgreSQL 16
- nginx: Reverse proxy with local self-signed certificates
- libraries: chess
	- since the task was creating a website, not coding chess from scratch, we used a library

## Database Schema
◦ Visual representation or description of the database structure.
◦ Tables/collections and their relationships.
◦ Key fields and data types.


## Features List
◦ Complete list of implemented features.
◦ Which team member(s) worked on each feature.
◦ Brief description of each feature’s functionality.

- Acount Creation, Modification, Deletion
- Profile, Statistics, Achievements
- Friend system
- Chess Game 
	- Bot with 3 dificulties
	- against other users
- Basic chat feature
- Leader board
- 4 languages


## Modules
◦ List of all chosen modules (Major and Minor).
◦ Point calculation (Major = 2pts, Minor = 1pt).
◦ Justification for each module choice, especially for custom "Modules of choice".
◦ How each module was implemented.
◦ Which team member(s) worked on each module.

| Module                         | Type (Pts) | Contributor(s)     |
|--------------------------------|------------|--------------------|
| Frontend & Backend framework   | Major (2)  | jfischer, yyakuben |
| Real-time features Websocket   | Major (2)  | jfischer           |
| User Interaction               | Major (2)  | jfischer, yyakuben |
| User Management & Auth         | Major (2)  | yyakuben           |
| Web based Game (Chess)         | Major (2)  | tabading           |
| AI Oppoenent                   | Major (2)  | jastomme           |
| Remote Players                 | Major (2)  | jfischer           |
| Monitoring System              | Major (2)  | jastomme           |
| ORM databse                    | Minor (1)  | ?                  |
| Remote OAuth 2.0               | Minor (1)  | yyakuben           | 
| Multiple language support      | Minor (1)  | yyakuben           |
| RTL (Arabic)                   | Minor (1)  | yyakuben           |
| Frontend framework (SPA)       | Minor (1)  | ???<- do we have this|
| Health check & status page     | Minor (1)  | jastomme           |
| Game stats & Match history     | Minor (1)  | yyakuben           |
| Game customization             | Minor (1)  | tabading           |
| Achievements                   | Minor (1)  | tabading           |



## Individual Contributions
◦ Detailed breakdown of what each team member contributed.
◦ Specific features, modules, or components implemented by each person.
◦ Any challenges faced and how they were overcome.


<yyakuben>: full base frontend, for others to work from
<jastomme>: full Devops, Chess bot 
<jfischer>: Database implementation, chat feature, friend feature, Websockets
<tabading>: chess implementation, Achievements, 

# Instructions

# Resources


