import React from 'react';
import { Image, Text, View } from 'react-native';
import { FadeInUpAnimation, LogoAnimation } from '~/components/animation/layout';
import { AnimatedButton } from '~/components/primitive/Button';
import tw from '~/lib/tailwind';
import { OnboardingStackScreenProps } from '~/navigation/OnboardingNavigator';

const OnboardingScreen = ({ navigation }: OnboardingStackScreenProps<'Onboarding'>) => {
	return (
		<View style={tw`flex-1 items-center justify-around bg-gray-650 p-4 z-10`}>
			{/* Logo */}
			<LogoAnimation>
				<View style={tw`items-center mt-2`}>
					<Image source={require('@sd/assets/images/logo.png')} style={tw`w-24 h-24`} />
				</View>
			</LogoAnimation>
			{/* Text */}
			<View>
				<FadeInUpAnimation delay={500}>
					<Text style={tw`text-white text-center text-5xl font-black leading-tight`}>
						A file explorer from the future.
					</Text>
				</FadeInUpAnimation>
				<FadeInUpAnimation delay={800}>
					<Text style={tw`text-gray-450 text-center px-6 mt-8 text-base leading-relaxed`}>
						Combine your drives and clouds into one database that you can organize and explore from
						any device.
					</Text>
				</FadeInUpAnimation>
			</View>
			{/* Get Started Button */}
			<FadeInUpAnimation delay={1200}>
				<AnimatedButton variant="primary" onPress={() => navigation.navigate('CreateLibrary')}>
					<Text style={tw`text-white text-center px-6 py-2 text-base font-medium`}>
						Get Started
					</Text>
				</AnimatedButton>
			</FadeInUpAnimation>
		</View>
	);
};

export default OnboardingScreen;
