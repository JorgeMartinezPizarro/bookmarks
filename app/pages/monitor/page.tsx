'use client'

import React, { useState } from 'react';
import { Button } from "@mui/material";
import { signIn, useSession } from "next-auth/react";
import "./styles.css";
import LoginIcon from '@mui/icons-material/Login';
import {useStats} from '@/app/hooks/useStats';
import { Chart } from '@/app/components/Chart';

const Monitor = () => {

	useSession();

	const messages = useStats();

	const [showDocker, setShowDocker] = useState(false);
	const [showProjects, setShowProjects] = useState(false);
	const loginButton = <Button variant="outlined" onClick={() => {
		signIn("nextcloud")
	}}><LoginIcon /></Button>

	const dockerProjects = (messages["docker.json"]?.content ?? []).reduce((acc: any, item: any) => {
		const projectName = item.name?.split("-")[0];
		if (acc[projectName]) acc[projectName].push(item);
		else acc[projectName] = [item];
		return acc;
	}, {} as Record<string, any[]>)

	const cores = messages["system.json"]?.content?.resources?.cpu?.cores || 1
	
	const attackers = messages["access.json"]?.content?.fails
		?.filter((row: any) => !messages["access.json"]?.content?.banned_ips?.includes(row.ip))
		
	return (
    <div className="my-frame">
		<div style={{ textAlign: "center" }} >
			{loginButton}
		</div>

		{messages["system.json"]?.content && messages["docker.json"]?.content && (
			<div className="my-grid">
					<p className="my-chart">{messages["system.json"].content.model}</p>
					<Chart label="CPU" value={messages["system.json"]?.content?.summary?.cpu_usage || 0} />
					<Chart label="RAM" value={messages["system.json"]?.content?.summary?.ram_usage || 0} />
					<Chart label="DISK" value={messages["system.json"]?.content?.summary?.disk_usage || 0} />
					<p><Button onClick={() => {setShowProjects(!showProjects)}} className="my-chart my-button">{Object.keys(dockerProjects).length} - projects running.</Button></p>
					{Object.keys(dockerProjects).map((row: any, id: number) => {
						const sumMem = dockerProjects[row].reduce((acc: number, item: any) => {
							return acc + parseFloat(item.memory?.replace("%", "") ?? "0");
						}, 0)
						const sumCPU = dockerProjects[row].reduce((acc: number, item: any) => {
							return acc + parseFloat(item.cpu?.replace("%", "") ?? "0");
						}, 0)
						let truncatedMem = Math.floor(sumMem * 100) / 100;
						let truncatedCPU = Math.floor(sumCPU / cores * 100) / 100;
						return <p key={id} className="my-chart" style={{display: showProjects ? "block" : "none"}}>
							{row} ({dockerProjects[row].length}) - {truncatedCPU} - {truncatedMem}
						</p>
						
					})}
					<p><Button onClick={() => {setShowDocker(!showDocker)}} className="my-chart my-button">{messages["docker.json"]?.content?.length ?? 0} - containers running.</Button></p>
					{messages["docker.json"].content.map((row: any, id: number) => {
						let status = row.status;
						if (!status.includes("("))
							status = status + " 🟢"
						return <p key={id} className="my-chart" style={{display: showDocker ? "block" : "none"}}>
							{row.name} - {status.replace("Up ", "").replace("(unhealthy)", "🔴").replace("(healthy)", "🟢").replace("(Paused)", "🟡")}
						</p>
					})}
			</div>
		)}

		

		{messages["access.json"]?.content && (
				<div className="my-grid">
						{messages["access.json"]?.content?.login?.map((row: any, id: number) => 
							<p className="my-chart" key={id}>
								✅ {row.ip} {row.count} times
							</p>
						)}
						{attackers
							.map((row: any, id: number) => 
								<p className="my-chart" key={id}>
									<td style={{textAlign: "right"}}>{row.ip} ❌</td>
									<td style={{textAlign: "left"}}>{row.count}</td>
								</p>
						)}
					
					<div>
						<Button
							variant="outlined"
							className="my-button my-chart"
							disabled={
								(attackers.length || 0) === 0
							}
							onClick={() => {
								const elements = attackers.map(
									(value: any) => `iptables -A INPUT -s ${value.ip} -j DROP`
								) ?? []
								const script = elements.join(" && ")
								navigator.clipboard.writeText(script)
							}}
						>
							Copy script to ban ips {messages["access.json"]?.content?.fails
								?.filter((row: any) => !messages["access.json"]?.content?.banned_ips?.includes(row.ip))
								.length ?? 0}
						</Button>
						<p className="my-chart">{messages["access.json"]?.content?.banned_ips?.length ?? 0} banned IPs so far</p>
					</div>
				</div>
		)}
	</div>
	)
};

export default Monitor;
