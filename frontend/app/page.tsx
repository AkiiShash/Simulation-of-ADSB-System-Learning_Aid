'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import * as Yup from 'yup';
import axios from 'axios';
import { Formik, FormikHelpers } from 'formik';

import Button from './components/Button';
import AlertMsg from './components/AlertMsg';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { login, setTokens } from '@/store/login';
import { RootState } from '@/store/store';
import { getMsgFromDict, getRedirectURL } from '@/data/funcs';
import endpoints from '@/data/endpoints';

const loginScheme = Yup.object().shape({
	email: Yup.string().email().required().label('Email'),
	password: Yup.string().min(8).required().label('Password'),
});

const initialValues = {
	email: '',
	password: '',
};

function page() {
	const dispatch = useDispatch();
	const navigation = useRouter();
	const loginData = useSelector((state: RootState) => state.loginData);

	async function handleSubmit(values: typeof initialValues, formikHelpers: FormikHelpers<typeof initialValues>) {
		await axios
			.post(endpoints.auth.login, values)
			.then((response) => {
				const data = response.data;
				console.log(data);
				dispatch(setTokens(data.tokens));
				dispatch(login(data.data));
			})
			.catch((error) => {
				const data = error.response.data;
				console.log(error);
				console.log(data);
				alert('Invalid credentials');
				if (data.hasOwnProperty('detail')) {
					formikHelpers.setErrors({ email: data.detail });
				} else {
					for (var key in data) {
						if (data.hasOwnProperty(key)) {
							formikHelpers.setErrors({ email: data[key][0] });
							break;
						}
					}
				}
			});
	}

	useEffect(() => {
		if (loginData.is_login) {
			const getURL = getRedirectURL() || '/dashboard';
			navigation.replace(getURL);
		}
	}, [loginData.is_login]);

	return (
		<div className="w-screen h-screen flex flex-col items-center justify-center">
			<div className="w-1/4 p-4 shadow-md rounded-md" style={{ width: 400 }}>
				<h1 className="text-3xl font-bold my-6">Login</h1>
				<Formik initialValues={initialValues} onSubmit={handleSubmit} validationSchema={loginScheme}>
					{({ handleSubmit, handleChange, errors, values }) => (
						<>
							<div className="my-2">
								<AlertMsg msg={getMsgFromDict(errors)} />
								<input
									onChange={(e) => handleChange('email')(e.target.value)}
									value={values.email}
									type="text"
									placeholder="Email"
									className="w-full py-2 my-2 px-4 border border-slate-300 rounded-md"
								/>
								<input
									onChange={(e) => handleChange('password')(e.target.value)}
									value={values.password}
									type="password"
									placeholder="Password"
									className="w-full py-2 my-2 px-4 border border-slate-300 rounded-md"
								/>
								<Button label="Login" className="w-full mt-6" onClick={handleSubmit} />
								<p className="mt-4 text-sm">
									Do not have an accont?{' '}
									<Link href={'/register'} className="text-indigo-600 hover:underline">
										Register
									</Link>
								</p>
							</div>
						</>
					)}
				</Formik>
			</div>
			<div className="h-80" />
		</div>
	);
}

export default page;
