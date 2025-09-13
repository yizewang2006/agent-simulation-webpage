package Activation_getCheckingValue;

import agents.Agent;

public class SelfChecking_Value extends Activation_CheckingValue
{

	public SelfChecking_Value(double c) 
	{
		super(c);
		
	}

	public double getSelfCheckingValue(Agent target_agent, double proprety_p)
	{
		//heading direction
		if(this.extracted_p == 1 || this.extracted_p == 2 || this.extracted_p == 2.1)
		{

			return target_agent.heading.value;
		}
		//Speed
		else if(this.extracted_p == 3)
		{
			return target_agent.speed.value;

		}
		//TYPE
		else if(this.extracted_p == 4)
		{
			return target_agent.type.value;

		}
		//ZONE
		else if(this.extracted_p == 5)
		{
			return target_agent.zone_in.value;

		}
		//Access to unreserved property
		else
		{
			for (int i = 0; i < target_agent.property_set.size(); i++)
			{
				if(this.extracted_p == target_agent.property_set.get(i).property_ID)
				{
					return target_agent.property_set.get(i).value;
				}
			}
		}
		
		System.out.println("Cannot get the checking value for Activation - Activation_getCheckingValue/SelfChecking_Value.java");
		
		return Double.NaN;
	}
}
