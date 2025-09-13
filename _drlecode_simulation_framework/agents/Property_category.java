package agents;

import java.util.ArrayList;

public class Property_category extends Property
{
	ArrayList<Double> set = new ArrayList<Double>();
	
	public Property_category()
	{
		
	}
	
	//This set is what options this property has
	public Property_category(double ID, double init_value,boolean p, boolean g, ArrayList<Double> set_add)
	{
		super(ID,init_value,p,g);
		
		for (Double d: set_add)
		{
			set.add(d);
		}
	}


}
