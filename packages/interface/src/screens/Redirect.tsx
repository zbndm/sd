import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export interface RedirectPageProps {
	to: string;
}

export const RedirectPage: React.FC<RedirectPageProps> = (props) => {
	const { to: destination } = props;

	const navigate = useNavigate();

	useEffect(() => {
		navigate(destination);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return null;
};
