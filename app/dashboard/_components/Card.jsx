import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

function Card({icon, title, value, trend, trendValue}) {
    const isPositive = trend === 'up';
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isPositive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}>
                            <TrendIcon className="w-3 h-3" />
                            {trendValue}%
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        {title}
                    </h3>
                    <p className="text-3xl font-bold text-gray-900">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Card;