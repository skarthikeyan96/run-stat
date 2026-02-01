import { Activity } from "lucide-react"

const Header = () => {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 px-6 py-4 bg-background dark:bg-background-dark shrink-0">
            <div className="flex items-center gap-4 text-primary">
                <div className="p-4 bg-[#fc4e03] rounded-md shadow-lg shadow-[#fc4e03]/30">
                    <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Run Stat</h2>
            </div>

        </header>
    )
}

export default Header;