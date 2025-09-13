package Action;

import java.util.ArrayList;
import java.util.Random;

import agents.Agent;
import core.Main;

public class SelfReference extends Action
{	
	//Random behavior
	//For self behavior, we only care for offset
	public SelfReference(double extract_p)
	{
		super(0, extract_p, 0);
		Random rand = new Random();
		
		ArrayList<Double> offset_list = Main.searchSpace.getOffsetList(extract_p);
		this.offset = offset_list.get(rand.nextInt(offset_list.size()));
		
	}
	
	//Pre-set self behavior
	public SelfReference(double offset, double extract_p)
	{
		super(0, extract_p, offset);
		this.offset = offset;
	}
	
	public double getReferenceValue(Agent target_agent)
	{
		
		//Angle behavior
		if(extract_property == 1 || extract_property == 2.0 || extract_property == 2.1)
		{
			reference_value = target_agent.heading.value;
			
			reference_value += offset;
			
			if (reference_value < 0)
			{
				reference_value = 360 + reference_value;
			}
			else if (reference_value > 360)
			{
				reference_value = reference_value - 360;
			}
			
			return reference_value;
		}
		//Speed behavior
		else if(extract_property == 3)
		{
			reference_value = target_agent.speed.value;
			reference_value += offset;
			return reference_value;
			
		}
		else if(extract_property == 4)
		{
			//Do not care for now
		}
		else if(extract_property == 5)
		{
			//Do not care for now
		}
		//Access to unreserved property
		else
		{

		}
		
		System.out.println("Not return a reference value of self reference action properly");
		return reference_value;
	}
}
