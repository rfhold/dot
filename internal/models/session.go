package models

import "time"

type TmuxPane struct {
	Index          int    `json:"index"`
	CurrentCommand string `json:"current_command"`
	Active         bool   `json:"active"`
	Title          string `json:"title"`
}

type TmuxWindow struct {
	Index  int        `json:"index"`
	Name   string     `json:"name"`
	Active bool       `json:"active"`
	Panes  []TmuxPane `json:"panes"`
}

type TmuxSession struct {
	Name          string       `json:"name"`
	Windows       int          `json:"windows"`
	WindowDetails []TmuxWindow `json:"window_details"`
	Attached      bool         `json:"attached"`
	LastActivity  time.Time    `json:"last_activity"`
}

type Machine struct {
	Name     string        `json:"name"`
	SSHHost  string        `json:"ssh_host"`
	SSHUser  string        `json:"ssh_user"`
	Sessions []TmuxSession `json:"sessions"`
	LastSeen time.Time     `json:"last_seen"`
}

type PushRequest struct {
	MachineName string        `json:"machine_name"`
	SSHHost     string        `json:"ssh_host"`
	SSHUser     string        `json:"ssh_user"`
	Sessions    []TmuxSession `json:"sessions"`
}

type SessionsResponse struct {
	Machines []Machine `json:"machines"`
}
