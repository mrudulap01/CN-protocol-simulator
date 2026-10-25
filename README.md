# 🌐 Computer Networks Protocol Simulator (NetMonitor)

An interactive, visual Computer Networks protocol simulator built with **React**, **Vite**, and **Tailwind CSS**. It visualizes packet flows, device interactions, and protocol handshakes step-by-step on an animated network canvas.

> 💡 **Client-Side Simulation:** All protocol exchanges are simulated within the browser for educational demonstrations. No real network packets are transmitted.

---

## 🚀 Features & Protocols

Interactive visual animations and scenario logs for core networking protocols:

- **DHCP (Dynamic Host Configuration Protocol):** Complete 4-step DORA handshake (Discover → Offer → Request → Acknowledge) demonstrating automated IP allocation, subnet mask, gateway, and lease assignment.
- **DNS (Domain Name System):** Translates domain names to IP addresses with scenarios for Cache Hit, Cache Miss (live query to DNS server), and NXDOMAIN (domain not found).
- **Ping / ICMP (Internet Control Message Protocol):** Sends Echo Requests and awaits Echo Replies. Simulates latency, round-trip time (RTT), and packet loss when links are broken.
- **SNMP (Simple Network Management Protocol):** Network manager querying router MIB parameters (`sysName`, `sysUpTime`, `cpuUsage`), including device online/offline timeout handling.
- **SMTP (Simple Mail Transfer Protocol):** Simulates sending an email through DNS mail server resolution, outgoing mail server, recipient mail server, and handling both successful delivery and 550 recipient mailbox errors.

---

## 🛠️ Quick Start / How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (bundled with Node.js)

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mrudulap01/CN-protocol-simulator.git
   cd CN-protocol-simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to the local URL displayed in your terminal (typically **`http://localhost:5173`**).

---

## 📦 Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4
- **Language:** JavaScript (ES Modules)

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite dev server with Hot Module Replacement |
| `npm run build` | Builds optimized production bundle in `dist/` |
| `npm run preview` | Locally previews the production build |
