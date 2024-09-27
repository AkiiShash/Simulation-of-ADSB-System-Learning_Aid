import React from 'react';

function AlertMsg({ msg }: { msg: string | null | undefined }) {
	return (
		<>
			{msg ? (
				<div className="bg-red-100 border border-red-500 rounded-lg p-4 mb-4">
					<p className="text-red-600">{msg}</p>
				</div>
			) : null}
		</>
	);
}

export default AlertMsg;
