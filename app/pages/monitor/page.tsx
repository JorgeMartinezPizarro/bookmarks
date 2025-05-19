'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { signIn, useSession } from "next-auth/react";
import "./styles.css";
import MainMenu from '@/app/components/MainMenu';
import { UsageBar } from '@/app/components/UsageBar';
import { access } from 'fs';
import { parse } from 'path';
import LoginIcon from '@mui/icons-material/Login';
import CloudIcon from '@mui/icons-material/Cloud';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ComputerIcon from '@mui/icons-material/Computer';
import ScheduleIcon from '@mui/icons-material/Schedule';


const Monitor = () => {

	/* TODO: Move read files to backend:
		- read files from nodejs fs
		- remove uneccessary reports apache server
		- sync with volumes
		- use new json sources to read server status
		- use websockets to retrieve real time data
		- sqlite db with historical data
	*/

	const { data: session, status } = useSession();

	
    const [show, setShow] = useState<string[]>(["main"])
	const [values, setValues] = useState<any>({groupedDockers: [], banned: [], resources: [], cron: [], docker: [], percentUsages: {}})
	const [copied, setCopied] = React.useState(false);
	const [failed, setFailed] = useState(false)
	
	const requestDocker = useCallback(() => {
		fetch('/bookmarks/api/report?name=docker', {credentials: 'include'})
			.then(a => a.json())
			.then(r => {
				const e = r.content || "";
				setValues((newValues: any) => {

					const dockers = e.split("\n").filter((a: string) => a.trim() !== "").map((a: any) => a.split("--").map((e: string, i: number) => (e.indexOf("(") === -1 && i===1)
						? (e.replace('Up ', '') +" ❤️")
						: (e
							.replace('Up ', '')
							.replace("(healthy)", "❤️")
							.replace("(Paused)", "⏸️")
							.replace("(unhealthy)", "❤️‍🩹")
							.split("/")[0]
						)
					))

					const r = (n: string) => Math.round(Number(n) * 100) / 100;

					const groupedDockers = dockers.reduce((acc: any, service: string[]) => {
						
						const newAcc = {...acc}
						const project = service[0].split("-")[0]
						
						const cpu = r(service[2].replace("%", ""))



						const ram = service[3].includes("GiB") 
							? r(service[3].replace("GiB", ""))*1024
							: r(service[3].replace("MiB", ""))


						if (newAcc[project]) {
							newAcc[project].services.push(service)
							newAcc[project].ram = Math.round(newAcc[project].ram + ram)
							newAcc[project].cpu = r(newAcc[project].cpu + cpu)
						} else {
							newAcc[project] = {
								services: [service],
								ram: Math.round(ram),
								cpu
							}
						}

						return newAcc

					}, {})

					console.log(groupedDockers)
					
					return {
						...newValues,
						groupedDockers: {...groupedDockers},
						docker: [
							...dockers,
						],
					};
				})
			})
			.catch(e => setFailed(true));
	}, [setValues])

	const requestResources = useCallback(() => {
        fetch('/bookmarks/api/report?name=computer', {credentials: 'include'})
			.then(a => a.json())
			.then(r => {
				const e = r.content || "";
				
				setValues((newValues: any) => {
					const a = e.split("\n");

					const percentUsages = {
						cpu: a[8]?.replace("CPU", "").replace("%", "").trim(),
						ram: a[9]?.replace("RAM", "").replace("%", "").trim(),
						disk: a[10]?.replace("Disk", "").replace("%", "").trim(),
					}

					return {
						...newValues,
						resources: [
							...a.slice(1,2).map((a: any) => [...a.split(" ").filter((a: any) => a!=="").slice(0, 2)]),
							...a.slice(3,6).map((a: any, i: number) => {
								const b = a.split("--")
								return [
									b[0],
									b[i === 0 ? 1 : 2]
								]
							}),
							...a.slice(8,12).map((x: any) => {
								return x.split(" ").filter((a: any) => a !== "").slice(0,2)
							}),
							...a.slice(13).map((x: any) => {
								return x.split(" ").filter((a: any) => a !== "").slice(0,2)
							}),
							
						],
						percentUsages
					};
				})
			})
			.catch(e => setFailed(true));
	}, [setValues])

	

	const readableTime = (d: string) => d.replace(/(\d+)m(\d+)\.\d+s/, (match, m, s) => 
		`${String(m).padStart(2, '0')}:${String(Math.round(s)).padStart(2, '0')}`
	);

	function reverseInBlocks(arr: any[], blockSize: number) {
		if (blockSize <= 0) throw new Error("Block size must be greater than 0");
			
		const result = [];
		for (let i = arr.length; i > 0; i -= blockSize) {
			const block = arr.slice(i - blockSize, i);
			result.push(...block);
		}
		return result;
	}

	const requestCron = useCallback(() => {
		fetch('/bookmarks/api/report?name=cron', {credentials: 'include'})
			.then(a => a.json())
			.then(r => {
				const e = r.content || "";
				setValues((newValues: any) => {
					const x = e.split("\n").filter((a: any, i: number) => a !== undefined && a !== "" && a.indexOf("====")===-1)

					const y = x							
						.map((a: any, i: number) => {

							if (i%5!==0 || x[i+2] === undefined) 
								return false
							const saveTime = readableTime(x[i+1])
							const pushTime = readableTime(x[i+3])
							const title = x[i+2].substring(0, x[i+2].indexOf(" ")).toUpperCase()
							
							return [
								a,
								title,
								"✅ in " + saveTime,
								"⬆️ in " + pushTime,
							]
								
						})
						.filter((a: any, i: number) => [0].includes(i%5))
					
					return {
						...newValues,
						cron: reverseInBlocks(y, 1).slice(0, 24)
					};
				})
			})
			.catch(e => setFailed(true));
	}, [setValues])
	
0
	const requestAccess = useCallback(() => {
        fetch('/bookmarks/api/report?name=access', {credentials: 'include'})
			.then(a => a.json())
			.then(r => {
				const e = r.content || "";

				if (e === "") return;
				setValues((newValues: any) => {
					const x = e.split("----------------- --------------------")

					const banned = x[4].split("\n").filter((x: any) => x !== "-" && x !== "")

					const access = [
						["############", "Last 48h"],
						...x[1].split("\n").map((a: any) => a.split(" 20").map((a: any) => a.replace("24-", "").replace("25-", "").replace("T", " at "))),
						["############", "Attempts"],
						...x[2].split("\n").map((a: any) => {
							const x = a.split(" ").filter((a: any) => a !== "")
							
							return [x[0], x[1]]
						}),
						["Banned", newValues.banned.length],
						["############", "Logins"],
						...x[3].split("\n").map((a: any) => {
							const x = a.split(" ").filter((a: any) => a !== "")
							return [x[0], x[1]]
						}),
					]
					
					return {

							...newValues,
							access: access.filter(a => a && a.join("").trim() !== ""),
							banned: [["Status", "IP"], ...[...(new Set(banned))].map(a => ["Blocked", a])],
					};
				})
			})
			.catch(e => console.error('Error', e));
	}, [setValues])

	const requestBannedIPs = useCallback(() => {
		fetch('/bookmarks/api/report?name=banned_ips_table', {credentials: 'include'})
			.then(a => a.json())
			.then(r => {
					const e = r.content || "";
                        setValues((newValues: any) => {
                            const list = e.split("\n")
							
							return {
                                        ...newValues,
                                        list: list.map((a: any)=>{
											const x = a.split("\t").filter((r: string) => r!=="")
											return x
											
										}).filter((a: string[]) => a.length === 3).map((x: any) => {
											
											return [
												x[0],
												x[1] + "❗​",
												x[2].replace(" 0 days 00:00:", "").replace(" 0 days 00:", "").replace(" 0 days ", "")
											]
										})
                                };
                        })
                })
		.catch(e => console.error('Error', e));
	}, [setValues])

	
	
	useEffect(() => {  
	
		const reloadIframes = () => {
			return [
				setInterval(requestCron, 5000),
				setInterval(requestResources, 1100),
				setInterval(requestBannedIPs, 2500),
				setInterval(requestAccess, 1500),
				setInterval(requestDocker, 1000),
			];
		}
	
		const requestData = () => {
			requestAccess();
			requestBannedIPs();
			requestCron();
			requestResources();
			requestDocker();
			
		}
		const a = setTimeout(requestData, 60);
		
		const ids = reloadIframes();
		return () => {
			clearTimeout(a)
			ids.forEach(clearInterval)
		};
	}, [requestCron, requestResources, requestBannedIPs, requestAccess, requestDocker]);

	const w = values.banned.map((b: string[]) => b[1].trim()).slice(1)

	const bannedIps = values.banned.map((a: string[]) => a[1]?.trim())
	
	const notBannedIps = values.list ? values.list
		.filter((value: string[]) => 
			!bannedIps.includes(value[0])
		)
		.map((value: string[]) => 
			`iptables -A INPUT -s ${value[0]} -j DROP`
		) : []

	const script = notBannedIps
		.join(" && ")

	
	const handleCopy = () => {
		navigator.clipboard.writeText(script).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000); // Reset tooltip after 2 seconds
		});
	};

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
					setShow([
						
					])
				} else {
					setShow([
						name
					])
				}
			}} >
				{icon}
		</Button>
	}

	const button = <Tooltip title={copied ? "Copied!" : "Ban " + (script === "" ? 0 : script.split("&&").length) + " attackers"} arrow>
      <Button
        variant="outlined"
        color={script==="" ? "primary" : "error"}
		onClick={handleCopy}
		
        startIcon={<ContentCopyIcon />}
      >
        Ban
      </Button>
	</Tooltip>

const loginButton = <Button variant="outlined" onClick={() => {
	signIn("nextcloud", {callbackUrl: window.location.href, redirect: true})
}}><LoginIcon /></Button>

	const parseValues = (array = [], suffix="") => {
		const x = array.filter((a: string[]) => a !== undefined && a.join && a.join("").trim() !== "" && !w.includes(a[0]?.trim()))
		return <table key={JSON.stringify(array)+suffix}>
			<tbody>
				{x.map((a: string[], i) => <tr key={i} title={
					(a && a.length > 1 && a[1].includes && a[1].includes("❗​")) ? ("Failed access attempts " + a[1].replace("❗​", "")) : undefined
				}>
					{a !== undefined && a?.map((e, j)=><td key={j} style={{textAlign: (j> 0 ? "right" : "left"), padding: '0 8px',}}>
						{w.includes(a[0]?.trim())
							? <span style={{color: "red"}}>{e}</span>
							: e
						}
					</td>)}
				</tr>)}
			</tbody>
		</table>
	}


	console.log(values.resources)

	const getResource = (search: string) => {

		const usedSearch = search === "gaming" ? "brain/data" : search

		const trueSearch = usedSearch === "mptree" ? "mptree/data" : usedSearch
		const item = values.resources.reverse().find((el: string[]) => el[0] && el[0].includes(trueSearch))
		if (item)
			return item[1]
		return "0K"
	}

	return (
    <div className="my-frame">
		<div style={{
			textAlign: "center"
		}} >
			{loginButton}
			{showButton("main")}
			{showButton("docker")}
			{showButton("access")}
			{showButton("cron")}
		</div>
		<div style={{ 
			padding: 0, 
			color: "white", 
			background: 'black', 
			height: 'calc(100% - 45px)', 
			overflow: 'hidden', 
			borderRadius: '4px',
			display: "inline-block"
		}}>
			<div
				id="resources"
				style={{
					height: 'calc(100% - 28px)',
					width: "400px",
					margin: '4px',
					display: !show.includes("main") ? "none" : "inline-block"
				}}
			>
				<div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
				{values.percentUsages?.ram && <UsageBar value={values.percentUsages?.ram} label="RAM" />}
				{values.percentUsages?.disk && <UsageBar value={values.percentUsages?.disk} label="Disk" />}
				{values.percentUsages?.cpu && <UsageBar value={values.percentUsages?.cpu} label="CPU" />}
				
				<table><tbody>
					<tr>
						<th>Name</th>
						<th>Disk</th>
						<th>RAM</th>
						<th>CPU</th>						
					</tr>
					{Object.keys(values.groupedDockers).map((line: string, i: number) => 
						<tr key={i}>
							<td style={{borderRight: "1pt solid #535333"}}>{line} ({values.groupedDockers[line].services.length})</td>
							<td style={{borderRight: "1pt solid #535333"}}>{getResource(line)}</td>
							<td style={{borderRight: "1pt solid #535333"}}>{values.groupedDockers[line].ram < 1024 ? (values.groupedDockers[line].ram+"MiB") : (values.groupedDockers[line].ram / 1024).toFixed(0)+"GiB"}</td>
							<td >{values.groupedDockers[line].cpu}%</td>
							
						</tr>
					)}
				</tbody></table>
				
				</div>
			</div>
			<div
				id="docker"
				style={{
					height: 'calc(100% - 28px)',
					display: !show.includes("docker") ? "none" : "inline-block"					
				}}
				title={Object.keys(values.docker).length + "  docker projects running"}

			>
				{parseValues(values.docker)}
			</div>
    		<div
				id="cron"
				style={{
					height: 'calc(100% - 28px)',
					display: !show.includes("cron") ? "none" : "inline-block"
				}}
				title="Cron"
			>
				<div className="cron-container">
					{parseValues(values.cron)}
				</div>
			</div>
			<div
        id="access"
        style={{
          display: !show.includes("access") ? "none" : 'inline-block',
          height: 'calc(100% - 28px)',
          
        }}
        title="Access report"
      >
		<p>Access</p>
		{parseValues(values.access, "x")}
		<p>{notBannedIps.lenght || 0} Failed attempts</p>
		{notBannedIps.map((ip: string, i: number) => <p key={i}>{ip}</p>)}
		{notBannedIps.length > 0 && button}
	</div>
    
	</div>
		
    </div>
  );
};

export default Monitor;
