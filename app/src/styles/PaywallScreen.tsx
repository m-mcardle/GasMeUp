import { StyleSheet } from 'react-native';

import { colors } from './styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 62,
    right: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    color: 'white',
    marginBottom: 10,
  },
  iconContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  features: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureItem: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
  },
  bestPricing: {
    backgroundColor: 'white',
    padding: 5,
    fontWeight: 'bold',
    marginBottom: 10,
    width: '100%',
    textAlign: 'center',
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'white',
    marginBottom: 10,
    backgroundColor: '#252525',
  },
  selectedPlan: {
    shadowOffset: { width: 0, height: 2 },
    shadowColor: colors.teal,
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.teal,
  },
  planText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
  },
  planPrice: {
    color: 'white',
    fontSize: 16,
  },
  cancelAnytime: {
    color: 'white',
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: colors.teal,
    padding: 15,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  continueText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  footerText: {
    color: 'white',
  },
});

export default {
  styles,
};
