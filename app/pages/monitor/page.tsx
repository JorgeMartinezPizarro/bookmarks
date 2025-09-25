'use client'

import React, { useState } from 'react';
import { Button } from "@mui/material";
import { signIn, useSession } from "next-auth/react";
import "./styles.css";
import LoginIcon from '@mui/icons-material/Login';
import CloudIcon from '@mui/icons-material/Cloud';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ComputerIcon from '@mui/icons-material/Computer';
import ScheduleIcon from '@mui/icons-material/Schedule';
import {useStats} from '@/app/hooks/useStats';
import { Chart } from '@/app/components/Chart';

const Monitor = () => {

	const { data: session, status } = useSession(); // force logged user.

	const messages = useStats("/bookmarks/api/report");

	const [show, setShow] = useState<string>("main")
	
	const loginButton = <Button variant="outlined" onClick={() => {
		signIn("nextcloud")
	}}><LoginIcon /></Button>

	const showButton = (name: string) => {
		let icon = undefined;

		if (name === "docker")
			icon = <CloudIcon />
		if (name === "access")
			icon = <VpnKeyIcon />
		if (name === "cron") 
			icon = <ScheduleIcon />
		if (name === "main")
			icon = <ComputerIcon />

		return <Button
			variant={show.includes(name) ? "contained" : "outlined"}
			onClick={() => {
				if (show.includes(name)) {
					setShow("")
				} else {
					setShow(name)
				}
			}} >
				{icon}
		</Button>
	}

	const dockerProjects = (messages["docker.json"]?.content ?? []).reduce((acc: any, item: any) => {
		const projectName = item.name?.split("-")[0];
		if (acc[projectName]) acc[projectName].push(item);
		else acc[projectName] = [item];
		return acc;
	}, {} as Record<string, any[]>)

	const cores = messages["system.json"]?.content?.resources?.cpu?.cores || 1
	
	return (
    <div className="my-frame">
		<div style={{ textAlign: "center" }} >
			{loginButton}
			{showButton("main")}
			{showButton("docker")}
			{showButton("access")}
		</div>

		{messages["system.json"]?.content && messages["docker.json"]?.content && (
			<div style={{display: (show === "main" ? "block": "none")}}>
				<div>
					<Chart label="CPU" value={messages["system.json"]?.content?.summary?.cpu_usage || 0} />
					<Chart label="RAM" value={messages["system.json"]?.content?.summary?.ram_usage || 0} />
					<Chart label="DISK" value={messages["system.json"]?.content?.summary?.disk_usage || 0} />
					<p className="my-chart">{Object.keys(dockerProjects).length} - projects running.</p>
					<p className="my-chart">{messages["docker.json"]?.content?.length ?? 0} - containers running.</p>
				</div>
			</div>
		)}

		<div className="my-grid" style={{display: (show === "docker" ? "block": "none")}}>
			{Object.keys(dockerProjects).map((row: any, id: number) => {
				const sumMem = dockerProjects[row].reduce((acc: number, item: any) => {
					return acc + parseFloat(item.memory?.replace("%", "") ?? "0");
				}, 0)
				const sumCPU = dockerProjects[row].reduce((acc: number, item: any) => {
					return acc + parseFloat(item.cpu?.replace("%", "") ?? "0");
				}, 0)
				let truncatedMem = Math.floor(sumMem * 100) / 100;
				let truncatedCPU = Math.floor(sumCPU / cores * 100) / 100;
				return <div key={id} className="docker-project">
					<p>{row} - ({dockerProjects[row].length})</p>
					<Chart label="CPU" value={truncatedCPU} />
					<Chart label="RAM" value={truncatedMem} />
				</div>
			})}
		</div>

		{messages["access.json"]?.content && (
			<div style={{display: (show === "access" ? "block": "none")}}>
				<div className="my-grid">
					<table><tbody>
						{messages["access.json"]?.content?.login?.map((row: any, id: number) => 
							<tr key={id}>
								<td style={{textAlign: "right"}}>{row.ip} ✅</td>
								<td style={{textAlign: "left"}}>{row.ultimo_acceso?.split(".")[0]}</td>
							</tr>
						)}
						{messages["access.json"]?.content?.fails
							?.filter((row: any) => !messages["access.json"]?.content?.banned_ips?.includes(row.ip))
							.map((row: any, id: number) => 
								<tr key={id}>
									<td style={{textAlign: "right"}}>{row.ip} ❌</td>
									<td style={{textAlign: "left"}}>{row.ultimo_acceso?.split(".")[0]}</td>
								</tr>
						)}
					</tbody></table>
					<div>
						<Button
							variant="outlined"
							className="my-button"
							disabled={
								(messages["access.json"]?.content?.fails
									?.filter((row: any) => !messages["access.json"]?.content?.banned_ips?.includes(row.ip))
									.map((value: any) => `iptables -A INPUT -s ${value.ip} -j DROP`)
									.length ?? 0) === 0
							}
							onClick={() => {
								const elements = messages["access.json"]?.content?.fails
									?.filter((row: any) => !messages["access.json"]?.content?.banned_ips?.includes(row.ip))
									.map((value: any) => `iptables -A INPUT -s ${value.ip} -j DROP`) ?? []
								const script = elements.join(" && ")
								navigator.clipboard.writeText(script)
							}}
						>
							Copy script to ban ips {messages["access.json"]?.content?.fails
								?.filter((row: any) => !messages["access.json"]?.content?.banned_ips?.includes(row.ip))
								.length ?? 0}
						</Button>
						<div>{messages["access.json"]?.content?.banned_ips?.length ?? 0} banned IPs.</div>
					</div>
				</div>
			</div>
		)}
	</div>
	)
};

export default Monitor;
