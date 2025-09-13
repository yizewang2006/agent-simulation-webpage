package Utility;

import java.util.ArrayList;

import agents.Heading;
import agents.Position;
import agents.Property;
import agents.Property_numeric;
import behavior.Constraint;

//Keep all the final value of each behavior group
//Until now, all property will modify: HEADING DIRECTION, and SPEED
public class ReturnVar 
{
	
	public ArrayList<DataStruct_ReserveProperty> heading_direction = new ArrayList<DataStruct_ReserveProperty>();
	
	public ArrayList<DataStruct_ReserveProperty> speed = new ArrayList<DataStruct_ReserveProperty>();
	
	public ArrayList<DataStruct_ReserveProperty> type = new ArrayList<DataStruct_ReserveProperty>();

	public ArrayList<DataStruct_unReserveProperty> property_set = new ArrayList<DataStruct_unReserveProperty>();
	
	public GlobalVariable global_var = new GlobalVariable();
		
		
	public ReturnVar()
	{

	}
	

	public void setHeadingReference(Heading heading, double value, double weight, ArrayList <Constraint> c_set)
	{

		if (value > 0)
		{
			while(value > heading.upperRange) //Will always = 360
			{
				value = value - 360;
			}
		}
		else if (value < 0)
		{
			while(value < - heading.upperRange) //Will always = 360
			{
				value = value + 360;
			}
		}


		//Check for min max value of constraint here
		for (Constraint c : c_set)
		{
			if (c.property_ID == 1 || c.property_ID == 2.0 || c.property_ID == 2.1)
			{
				if (value > 0)
				{
					if (value > c.max_value)
					{
						value = c.max_value;
					}
				}
				else if (value < 0)
				{
					if (value < 0)
					{
						if (value < c.min_value)
						{
							value = c.min_value;
						}
					}
				}
			}

			break;
		}


		this.heading_direction.add(new DataStruct_ReserveProperty(value,weight));
	}
		

	public void setNumericReference(Property property, double value, double weight, ArrayList <Constraint> c_set)
	{
		//Reach the minimum global speed
		if (property instanceof Property_numeric)
		{
			Property_numeric pn = (Property_numeric) property;
			
			if (value < pn.lowerRange )
			{
				value = pn.lowerRange;
			}
			else if (value > pn.upperRange)
			{
				value = pn.upperRange;
			}
		}
		
		
		//Need to revise this 
		for (Constraint c : c_set)
		{
			if (c.property_ID == 4)
			{
				if (value > 0)
				{
					if (value > c.max_value)
					{
						value = c.max_value;
					}
				}
				else if (value <= 0)
				{
					if (value <= 0)
					{
						if (value < c.min_value)
						{
							value = c.min_value;
						}
					}
				}
				break;
			}
			
			
		}
		
		this.speed.add(new DataStruct_ReserveProperty(value,weight));
	}
	//Access to unreserved property
	public void setReturnUserDefineProperty(int extract_p, Property p_set, double value, double weight)
	{
		boolean dublicate = false;
		int index = 0;
		//Check to see if the property already in the list
		for(int i = 0; i < property_set.size(); i++)
		{
			if (property_set.get(i).property_ID == extract_p)
			{
				dublicate = true;
				index = i;
				break;
			}
		}
		
		/*
		//Fix the value if out of bound
		if (value < p_set.lowerRange)
		{
			value = p_set.lowerRange;
		}
		else if (value > p_set.upperRange)
		{
			value = p_set.upperRange;
		}
		*/
		
		//If the property is new
		//Add one here
		if (dublicate == false)
		{
			property_set.add(new DataStruct_unReserveProperty(extract_p, value, weight));
		}
		//If the property is already existed
		else
		{
			property_set.get(index).value_set.add(value);
			property_set.get(index).weight_set.add(weight);
		}
	}
	
}
