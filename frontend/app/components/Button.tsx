'use client';
import React, { useState } from 'react';

export type ButtonProps = {
	label: string;
	mode?: 'rounded' | 'square' | 'transparent' | 'outline' | 'bullet';
	className?: string;
	onClick?: Function;
	btnType?: 'success' | 'danger';
};

function Button({ label, mode = 'bullet', onClick, className, btnType = 'success' }: ButtonProps) {
	let btn_mode;
	let bg_color = 'bg-indigo-500';
	let spin_color = 'bg-white';

	if (mode === 'outline') {
		if (btnType === 'success') {
			bg_color = 'bg-white';
			spin_color = 'bg-indigo-500';
		} else if (btnType === 'danger') {
			bg_color = 'bg-white';
			spin_color = 'bg-red-500';
		}
		btn_mode = `py-2 px-6 ${bg_color} text-red-500 rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white`;
	} else if (mode === 'bullet') {
		if (btnType === 'success') {
			bg_color = 'bg-indigo-500';
		} else if (btnType === 'danger') {
			bg_color = 'bg-red-500';
		}
		spin_color = 'bg-white';
		btn_mode = `py-2 px-6 ${bg_color} text-white rounded-full hover:opacity-80`;
	} else if (mode === 'square') {
		if (btnType === 'success') {
			bg_color = 'bg-indigo-500';
		} else if (btnType === 'danger') {
			bg_color = 'bg-red-500';
		}
		spin_color = 'bg-white';
		btn_mode = `py-2 px-6 ${bg_color} text-white hover:opacity-80`;
	} else if (mode === 'rounded') {
		if (btnType === 'success') {
			bg_color = 'bg-indigo-500';
		} else if (btnType === 'danger') {
			bg_color = 'bg-red-500';
		}
		spin_color = 'bg-white';
		btn_mode = `py-2 px-6 ${bg_color} text-white rounded-md hover:opacity-80`;
	} else if (mode === 'transparent') {
		if (btnType === 'success') {
			bg_color = 'bg-indigo-500';
		} else if (btnType === 'danger') {
			bg_color = 'bg-red-500';
		}
		spin_color = 'bg-theme';
		btn_mode = `${bg_color} text-theme hover:underline`;
	}

	const [isLoading, setIsLoading] = useState<boolean>(false);

	async function submit() {
		if (onClick) {
			setIsLoading(true);
			try {
				await onClick();
			} catch (error) {
				console.error('Error occurred during button click:', error);
			} finally {
				setIsLoading(false);
			}
		}
	}
	return (
		<button disabled={isLoading} className={`flex flex-row ${btn_mode} items-center justify-center ${className}`} type="button" onClick={submit}>
			{isLoading ? (
				<div className="animate-spin h-5 w-5 mr-3 overflow-hidden rounded-full flex flex-row items-center justify-center relative">
					<div className={`w-1/2 h-full ${spin_color}`} />
					<div className={`w-1/2 h-full ${spin_color} opacity-50`} />
					<div className={`w-4/5 h-4/5 ${bg_color} absolute rounded-full`} />
				</div>
			) : null}
			{label}
		</button>
	);
}

export default Button;
